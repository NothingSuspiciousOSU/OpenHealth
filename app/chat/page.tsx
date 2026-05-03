"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  billDocumentContextSchema,
  BillDocumentContext,
  CHAT_PDF_MIME_TYPE,
  ExtractDocumentRequest,
  MAX_CHAT_PDF_BYTES,
  validatePdfAttachmentSelection,
} from "@/lib/shared/chat/documentContext";

type AttachmentState = {
  fileName: string;
  sizeBytes: number;
  status: "idle" | "reading" | "ready" | "error";
  error?: string;
};

type RenderablePart = {
  type?: unknown;
  text?: unknown;
  state?: unknown;
  input?: unknown;
  output?: unknown;
};

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [documentContext, setDocumentContext] =
    useState<BillDocumentContext | null>(null);
  const [attachment, setAttachment] = useState<AttachmentState | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const shouldFollowTranscriptRef = useRef(true);

  const { messages, sendMessage, regenerate, stop, status, error } = useChat();
  const busy = status === "submitted" || status === "streaming";
  const readingPdf = attachment?.status === "reading";

  const modelProgressLabel = useMemo(() => {
    if (status === "submitted") return "Waiting for model";
    if (status === "streaming") return "Model is replying";
    return null;
  }, [status]);

  const attachmentStatusLabel = useMemo(() => {
    if (!attachment) return "No PDF attached";
    if (attachment.status === "ready") return "PDF ready";
    if (attachment.status === "reading") return "Reading PDF";
    if (attachment.status === "error") return "Needs text fallback";
    return "PDF attached";
  }, [attachment]);

  const scrollTranscriptToBottom = useCallback((behavior: ScrollBehavior) => {
    requestAnimationFrame(() => {
      transcriptEndRef.current?.scrollIntoView({ block: "end", behavior });
    });
  }, []);

  const handleTranscriptScroll = useCallback(() => {
    const element = transcriptRef.current;
    if (!element) return;

    shouldFollowTranscriptRef.current = isNearBottom(element);
  }, []);

  useEffect(() => {
    if (!shouldFollowTranscriptRef.current) return;
    scrollTranscriptToBottom(status === "streaming" ? "auto" : "smooth");
  }, [messages, scrollTranscriptToBottom, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy || readingPdf) return;

    shouldFollowTranscriptRef.current = true;
    setClientError(null);
    setInput("");
    scrollTranscriptToBottom("smooth");
    await sendMessage(
      { text },
      { body: { documentContext: documentContext ?? undefined } },
    );
  }

  async function handleRegenerate() {
    if (busy) return;

    shouldFollowTranscriptRef.current = true;
    scrollTranscriptToBottom("smooth");
    await regenerate({
      body: { documentContext: documentContext ?? undefined },
    });
  }

  async function handleFileChange(files: FileList | null) {
    setClientError(null);
    setDocumentContext(null);

    if (!files || files.length === 0) {
      setAttachment(null);
      return;
    }

    const validation = validatePdfAttachmentSelection(files);
    if (!validation.ok) {
      setAttachment(null);
      setClientError(validation.error);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const file = validation.file;
    setAttachment({
      fileName: file.name,
      sizeBytes: file.size,
      status: "reading",
    });

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const payload: ExtractDocumentRequest = {
        fileName: file.name,
        mimeType: CHAT_PDF_MIME_TYPE,
        sizeBytes: file.size,
        dataUrl,
      };

      const response = await fetch("/api/chat/extract-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof json?.error === "string"
            ? json.error
            : "Could not read that PDF.",
        );
      }

      const parsed = billDocumentContextSchema.parse(json);
      setDocumentContext(parsed);
      setAttachment({
        fileName: file.name,
        sizeBytes: file.size,
        status: "ready",
      });
    } catch (extractError) {
      setAttachment({
        fileName: file.name,
        sizeBytes: file.size,
        status: "error",
        error:
          extractError instanceof Error
            ? extractError.message
            : "Could not read that PDF.",
      });
    }
  }

  function removeAttachment() {
    setAttachment(null);
    setDocumentContext(null);
    setClientError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-3 px-3 py-3 sm:px-4 lg:flex-row lg:gap-4 lg:px-6">
        <aside className="min-h-0 shrink-0 lg:w-80">
          <ContextPanel
            attachment={attachment}
            attachmentStatusLabel={attachmentStatusLabel}
            busy={busy}
            documentContext={documentContext}
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
            onRemoveAttachment={removeAttachment}
            readingPdf={readingPdf}
          />
        </aside>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <header className="shrink-0 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold tracking-tight">
                  Bill Chat
                </h1>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  Ask about charges, codes, allowed amounts, and price context.
                </p>
              </div>
              <span className="shrink-0 rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                {modelProgressLabel ?? "Ready"}
              </span>
            </div>
            {modelProgressLabel && (
              <div className="mt-3">
                <ActivityBar label={modelProgressLabel} />
              </div>
            )}
          </header>

          <div
            ref={transcriptRef}
            onScroll={handleTranscriptScroll}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4"
          >
            {messages.length === 0 ? (
              <div className="flex min-h-full items-center justify-center px-2 text-center">
                <div className="max-w-md">
                  <p className="text-base font-semibold">
                    Ask a bill transparency question.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                    The agent can compare OpenHealth records and pull current
                    public billing context when needed.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    parts={message.parts as RenderablePart[]}
                    role={message.role}
                  />
                ))}
              </div>
            )}
            <div ref={transcriptEndRef} />
          </div>

          <div className="shrink-0 border-t border-zinc-200 p-3 dark:border-zinc-800 sm:p-4">
            {(clientError || error) && (
              <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {clientError || error?.message}
              </p>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={3}
                disabled={busy}
                placeholder="Ask whether a charge looks high, what a CPT code means, or what to ask next."
                className="max-h-36 min-h-20 resize-none rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-sky-400 dark:focus:ring-sky-950"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 text-xs text-zinc-500 dark:text-zinc-400">
                  {readingPdf ? "Reading PDF" : attachmentStatusLabel}
                </div>
                <div className="flex items-center gap-2">
                  {busy && (
                    <button
                      type="button"
                      onClick={() => void stop()}
                      className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
                    >
                      Stop
                    </button>
                  )}
                  {messages.length > 0 && !busy && (
                    <button
                      type="button"
                      onClick={() => void handleRegenerate()}
                      className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
                    >
                      Regenerate
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!input.trim() || busy || readingPdf}
                    className="rounded-md bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Send
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

function ContextPanel({
  attachment,
  attachmentStatusLabel,
  busy,
  documentContext,
  fileInputRef,
  onFileChange,
  onRemoveAttachment,
  readingPdf,
}: {
  attachment: AttachmentState | null;
  attachmentStatusLabel: string;
  busy: boolean;
  documentContext: BillDocumentContext | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (files: FileList | null) => void;
  onRemoveAttachment: () => void;
  readingPdf: boolean;
}) {
  return (
    <div className="flex max-h-[34dvh] min-h-0 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:max-h-[28dvh] lg:h-full lg:max-h-none lg:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight">
            Document Context
          </h2>
          <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            Attach one bill PDF or paste details directly into chat.
          </p>
        </div>
        <span className="shrink-0 rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
          {attachmentStatusLabel}
        </span>
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(16rem,1fr)] sm:gap-3 lg:block">
        <div>
          <label
            htmlFor="bill-pdf"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            PDF bill
          </label>
          <input
            ref={fileInputRef}
            id="bill-pdf"
            type="file"
            accept={CHAT_PDF_MIME_TYPE}
            disabled={busy || readingPdf}
            onChange={(event) => onFileChange(event.target.files)}
            className="mt-2 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-zinc-700 disabled:opacity-60 dark:text-zinc-300 dark:file:bg-zinc-100 dark:file:text-zinc-950"
          />
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
            One PDF, up to {Math.round(MAX_CHAT_PDF_BYTES / 1024 / 1024)} MB.
          </p>
          {readingPdf && (
            <div className="mt-3">
              <ActivityBar label="Reading PDF" />
            </div>
          )}
        </div>

        <div className="mt-3 min-w-0 sm:mt-0 lg:mt-4">
          {attachment ? (
            <AttachmentCard
              attachment={attachment}
              onRemoveAttachment={onRemoveAttachment}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              Upload-ready. You can start without a PDF.
            </div>
          )}

          {documentContext && (
            <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950">
              <p className="font-medium">Extracted context</p>
              <dl className="mt-3 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                <ContextRow label="Provider" value={documentContext.providerName} />
                <ContextRow label="Hospital" value={documentContext.hospitalName} />
                <ContextRow
                  label="Billed"
                  value={formatMoney(documentContext.billedAmount)}
                />
                <ContextRow
                  label="Allowed"
                  value={formatMoney(documentContext.allowedAmount)}
                />
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AttachmentCard({
  attachment,
  onRemoveAttachment,
}: {
  attachment: AttachmentState;
  onRemoveAttachment: () => void;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{attachment.fileName}</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {formatBytes(attachment.sizeBytes)} ·{" "}
            {attachment.status === "ready"
              ? "Ready"
              : attachment.status === "reading"
                ? "Reading"
                : attachment.status === "error"
                  ? "Needs text fallback"
                  : "Attached"}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemoveAttachment}
          className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        >
          Remove
        </button>
      </div>
      {attachment.error && (
        <p className="mt-3 text-sm leading-6 text-amber-700 dark:text-amber-300">
          {attachment.error} Paste the key bill text into chat.
        </p>
      )}
    </div>
  );
}

function MessageBubble({
  parts,
  role,
}: {
  parts: RenderablePart[];
  role: string;
}) {
  const isUser = role === "user";

  return (
    <div
      className={
        isUser
          ? "ml-auto max-w-3xl rounded-lg bg-zinc-900 px-4 py-3 text-white dark:bg-zinc-100 dark:text-zinc-950"
          : "mr-auto max-w-3xl"
      }
    >
      {!isUser && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          OpenHealth Agent
        </p>
      )}
      <MessageParts assistant={!isUser} parts={Array.isArray(parts) ? parts : []} />
    </div>
  );
}

function MessageParts({
  assistant,
  parts,
}: {
  assistant: boolean;
  parts: RenderablePart[];
}) {
  return (
    <div className="space-y-3">
      {parts.map((part, index) => {
        if (part.type === "text" && typeof part.text === "string") {
          return assistant ? (
            <AssistantMarkdown key={index}>{part.text}</AssistantMarkdown>
          ) : (
            <p key={index} className="whitespace-pre-wrap text-sm leading-6">
              {part.text}
            </p>
          );
        }

        if (typeof part.type === "string" && part.type.startsWith("tool-")) {
          return <ToolPart key={index} part={part} />;
        }

        return null;
      })}
    </div>
  );
}

function AssistantMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={markdownComponents}
    >
      {children}
    </ReactMarkdown>
  );
}

const markdownComponents: Components = {
  a({ children, href }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-600 dark:text-sky-300 dark:decoration-sky-700 dark:hover:text-sky-200"
      >
        {children}
      </a>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote className="my-3 border-l-2 border-zinc-300 pl-4 text-sm leading-6 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
        {children}
      </blockquote>
    );
  },
  code({ children, className }) {
    return (
      <code
        className={`${className ?? ""} rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.85em] text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100`}
      >
        {children}
      </code>
    );
  },
  h1({ children }) {
    return (
      <h1 className="mb-3 mt-5 text-xl font-semibold tracking-tight first:mt-0">
        {children}
      </h1>
    );
  },
  h2({ children }) {
    return (
      <h2 className="mb-2 mt-5 text-lg font-semibold tracking-tight first:mt-0">
        {children}
      </h2>
    );
  },
  h3({ children }) {
    return (
      <h3 className="mb-2 mt-4 text-base font-semibold tracking-tight first:mt-0">
        {children}
      </h3>
    );
  },
  hr() {
    return <hr className="my-4 border-zinc-200 dark:border-zinc-800" />;
  },
  li({ children }) {
    return <li className="pl-1">{children}</li>;
  },
  ol({ children }) {
    return (
      <ol className="my-3 list-decimal space-y-1 pl-5 text-sm leading-6">
        {children}
      </ol>
    );
  },
  p({ children }) {
    return <p className="my-3 text-sm leading-6 first:mt-0 last:mb-0">{children}</p>;
  },
  pre({ children }) {
    return (
      <pre className="my-3 max-w-full overflow-x-auto rounded-lg bg-zinc-950 p-3 text-xs leading-5 text-zinc-50 dark:bg-black [&_code]:rounded-none [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit">
        {children}
      </pre>
    );
  },
  table({ children }) {
    return (
      <div className="my-4 max-w-full overflow-x-auto overscroll-x-contain">
        <table className="min-w-full border-collapse text-left text-sm">
          {children}
        </table>
      </div>
    );
  },
  tbody({ children }) {
    return <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">{children}</tbody>;
  },
  td({ children }) {
    return (
      <td className="border border-zinc-200 px-3 py-2 align-top dark:border-zinc-800">
        {children}
      </td>
    );
  },
  th({ children }) {
    return (
      <th className="border border-zinc-200 bg-zinc-50 px-3 py-2 font-semibold dark:border-zinc-800 dark:bg-zinc-900">
        {children}
      </th>
    );
  },
  ul({ children }) {
    return (
      <ul className="my-3 list-disc space-y-1 pl-5 text-sm leading-6">
        {children}
      </ul>
    );
  },
};

function ToolPart({ part }: { part: RenderablePart }) {
  const label = String(part.type).replace("tool-", "");
  const status =
    part.state === "output-available"
      ? "Done"
      : part.state === "input-available"
        ? "Running"
        : "Pending";

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{formatToolName(label)}</p>
        <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
          {status}
        </span>
      </div>
      {part.output !== undefined && (
        <pre className="mt-3 max-h-44 overflow-auto whitespace-pre-wrap rounded-md bg-white p-3 text-xs leading-5 text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
          {JSON.stringify(part.output, null, 2)}
        </pre>
      )}
    </div>
  );
}

function ActivityBar({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        <span>{label}</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuetext={label}
        className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900"
      >
        <div className="chat-activity-bar h-full w-1/3 rounded-full bg-sky-500" />
      </div>
    </div>
  );
}

function ContextRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt>{label}</dt>
      <dd className="truncate text-right font-medium text-zinc-900 dark:text-zinc-100">
        {value || "Unknown"}
      </dd>
    </div>
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Could not read file as a data URL."));
      }
    };
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

function isNearBottom(element: HTMLElement) {
  return element.scrollHeight - element.scrollTop - element.clientHeight < 96;
}

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatToolName(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());
}
