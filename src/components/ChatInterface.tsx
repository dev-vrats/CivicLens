"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/hooks/useChat";
import LoadingSpinner from "./LoadingSpinner";
import { Send, Bot, MapPin } from "lucide-react";

interface ChatInterfaceProps {
  imageUrl: string;
  lat: number;
  lng: number;
  docId: string;
}

export default function ChatInterface({ imageUrl, lat, lng, docId }: ChatInterfaceProps) {
  const { messages, sendMessage, loading } = useChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    sendMessage(
      "Please analyze this civic issue I've just reported and ask me a helpful follow-up question.",
      imageUrl,
      lat,
      lng
    );
  }, [sendMessage, imageUrl, lat, lng]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await sendMessage(text);
  }, [input, loading, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full max-w-md mx-auto flex flex-col card"
      style={{ height: "calc(100dvh - 180px)", minHeight: 480, maxHeight: 680 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <div
          className="rounded-lg overflow-hidden flex-shrink-0"
          style={{ width: 36, height: 36, border: "1px solid var(--border)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="Report" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Bot size={14} color="var(--accent)" strokeWidth={2} />
            <span className="font-medium text-sm" style={{ color: "var(--text-1)" }}>CivicLens AI</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(34,197,94,0.15)", fontSize: 11 }}
            >
              online
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={10} color="var(--text-3)" />
            <span style={{ color: "var(--text-3)", fontSize: 11, fontFamily: "monospace" }}>
              {lat.toFixed(4)}, {lng.toFixed(4)} · {docId.slice(0, 8)}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "ai" && (
                <div
                  className="flex-shrink-0 mr-2 mt-1 rounded-full flex items-center justify-center"
                  style={{ width: 26, height: 26, background: "var(--accent-dim)", border: "1px solid rgba(0,194,255,0.15)" }}
                >
                  <Bot size={13} color="var(--accent)" strokeWidth={2} />
                </div>
              )}
              <div className={msg.role === "user" ? "bubble-user" : "bubble-ai"}>
                <p
                  style={{ color: "var(--text-1)", fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap" }}
                  className={msg.streaming && msg.content.length > 0 ? "typing-cursor" : ""}
                >
                  {msg.content || (msg.streaming ? "\u00a0" : "…")}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && messages[messages.length - 1]?.role !== "ai" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <div className="flex-shrink-0 rounded-full flex items-center justify-center"
              style={{ width: 26, height: 26, background: "var(--accent-dim)", border: "1px solid rgba(0,194,255,0.15)" }}>
              <Bot size={13} color="var(--accent)" strokeWidth={2} />
            </div>
            <div className="bubble-ai flex items-center gap-2">
              <LoadingSpinner size="sm" />
              <span style={{ color: "var(--text-3)", fontSize: 13 }}>Analyzing…</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 p-3" style={{ borderTop: "1px solid var(--border)" }}>
        <textarea
          ref={textareaRef}
          id="chat-input"
          className="input flex-1 resize-none"
          style={{ minHeight: 40, maxHeight: 120, borderRadius: 8, padding: "9px 12px", fontSize: 14 }}
          placeholder="Reply to CivicLens AI…"
          value={input}
          onChange={autoResize}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={loading}
        />
        <button
          id="btn-send-message"
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="btn btn-accent flex-shrink-0"
          style={{ padding: "9px 12px", borderRadius: 8, opacity: !input.trim() || loading ? 0.4 : 1 }}
        >
          <Send size={15} strokeWidth={2} />
        </button>
      </div>
    </motion.div>
  );
}
