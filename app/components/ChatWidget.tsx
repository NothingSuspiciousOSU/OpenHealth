"use client";

import { useChat } from "ai/react";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
    const { messages, input, handleInputChange, setInput, append, isLoading } = useChat();

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
      >
        <MessageCircle size={28} />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className={`fixed right-6 bottom-24 z-50 flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl transition-all dark:border-zinc-800 dark:bg-zinc-950 ${
              isExpanded ? "h-[80vh] w-[90vw] sm:w-[500px]" : "h-[500px] w-[350px]"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-sky-500 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <Bot size={20} />
                <span className="text-sm font-semibold">OpenHealth Assistant</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="rounded-md p-1 hover:bg-white/20"
                >
                  {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-md p-1 hover:bg-white/20"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
            >
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-center space-y-2">
                  <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center dark:bg-zinc-800">
                    <Bot className="text-zinc-400" />
                  </div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    How can I help you today?
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 px-4">
                    Ask me about procedure costs, trending treatments, or how to spot billing errors.
                  </p>
                </div>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                      m.role === "user"
                        ? "bg-sky-500 text-white"
                        : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1 opacity-70">
                      {m.role === "user" ? <User size={12} /> : <Bot size={12} />}
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {m.role === "user" ? "You" : "Assistant"}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {m.content}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-zinc-100 px-4 py-2 text-zinc-500 dark:bg-zinc-800">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-xs">Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!input.trim() || isLoading) return;
                append({ role: "user", content: input });
                setInput("");
              }}
              className="border-t border-zinc-100 p-4 dark:border-zinc-800"
            >
              <div className="relative">
                <input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask a question..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-4 pr-12 text-sm focus:border-sky-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500 text-white transition-opacity disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
