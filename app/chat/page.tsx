"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
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

  const { messages, sendMessage, regenerate, stop, status, error } = useChat();
  const busy = status === "submitted" || status === "streaming";
  const readingPdf = attachment?.status === "reading";

  const progressLabel = useMemo(() => {
    if (readingPdf) return "Reading PDF";
    if (status === "submitted") return "Starting agent";
    if (status === "streaming") return "Agent running";
    return null;
  }, [readingPdf, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy || readingPdf) return;

    setClientError(null);
    setInput("");
    await sendMessage(
      { text },
      { body: { documentContext: documentContext ?? undefined } },
    );
  }

  async function handleRegenerate() {
    if (busy) return;
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
    <div className="min-h-screen bg-zinc-50 py-8 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 lg:h-[calc(100vh-7rem)] lg:flex-row">
        <aside className="w-full shrink-0 lg:w-80">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-lg font-semibold tracking-tight">
                  Bill Chat
                </h1>
                <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  Ask about charges, CPT codes, allowed amounts, or OpenHealth
                  price comparisons.
                </p>
              </div>
              {progressLabel && (
                <span className="rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                  {progressLabel}
                </span>
              )}
            </div>

            <div className="mt-5">
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
                onChange={(event) => handleFileChange(event.target.files)}
                className="mt-2 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-zinc-700 disabled:opacity-60 dark:text-zinc-300 dark:file:bg-zinc-100 dark:file:text-zinc-950"
              />
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                One PDF, up to {Math.round(MAX_CHAT_PDF_BYTES / 1024 / 1024)} MB.
              </p>
            </div>

            {attachment && (
              <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {attachment.fileName}
                    </p>
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
                    onClick={removeAttachment}
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
            )}

            {documentContext && (
              <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950">
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
        </aside>

        <section className="flex min-h-[620px] flex-1 flex-col rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex-1 overflow-y-auto p-5">
            {messages.length === 0 ? (
              <div className="flex h-full min-h-[420px] items-center justify-center text-center">
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
                  <div
                    key={message.id}
                    className={
                      message.role === "user"
                        ? "ml-auto max-w-3xl rounded-xl bg-zinc-900 px-4 py-3 text-white dark:bg-zinc-100 dark:text-zinc-950"
                        : "mr-auto max-w-3xl"
                    }
                  >
                    {message.role === "assistant" && (
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        OpenHealth Agent
                      </p>
                    )}
                    <MessageParts parts={message.parts as RenderablePart[]} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
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
                className="min-h-24 resize-none rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-sky-400 dark:focus:ring-sky-950"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {progressLabel ?? "Ready"}
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

function MessageParts({ parts }: { parts: RenderablePart[] }) {
  return (
    <div className="space-y-3">
      {parts.map((part, index) => {
        if (part.type === "text" && typeof part.text === "string") {
          return (
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
