"use client";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/hooks/useChat";
import { useChatHistory } from "@/hooks/useChatHistory";
import { Send, Bot, MapPin, RotateCcw } from "lucide-react";

interface ChatInterfaceProps {
  imageUrl: string;
  lat: number;
  lng: number;
  docId: string;
}

/* ── Animated typing dots ── */
function TypingDots() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 0" }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          style={{
            display: "inline-block",
            width: 5, height: 5,
            borderRadius: "50%",
            background: "var(--accent)",
          }}
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

export default function ChatInterface({ imageUrl, lat, lng, docId }: ChatInterfaceProps) {
  const { save, load } = useChatHistory(docId);

  // Load saved history once on mount — stable reference
  const initialMessages = useMemo(() => load(), []);  // eslint-disable-line react-hooks/exhaustive-deps

  const { messages, sendMessage, loading, error } = useChat(initialMessages, save);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Only send the initial AI greeting if there's no existing history
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (initialMessages.length === 0) {
      sendMessage(
        "Please analyze this civic issue I've just reported and ask me a helpful follow-up question.",
        imageUrl,
        lat,
        lng
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleRetry = useCallback(() => {
    sendMessage(
      "Please analyze this civic issue I've just reported and ask me a helpful follow-up question.",
      imageUrl, lat, lng
    );
  }, [sendMessage, imageUrl, lat, lng]);

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
            <motion.span
              className="text-xs px-2 py-0.5 rounded-full"
              animate={loading ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }}
              transition={{ duration: 1.2, repeat: loading ? Infinity : 0 }}
              style={{
                background: loading ? "var(--accent-dim)" : "var(--green-dim)",
                color: loading ? "var(--accent)" : "var(--green)",
                border: `1px solid ${loading ? "rgba(0,194,255,0.2)" : "rgba(34,197,94,0.15)"}`,
                fontSize: 11,
              }}
            >
              {loading ? "typing…" : "online"}
            </motion.span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={10} color="var(--text-3)" />
            <span style={{ color: "var(--text-3)", fontSize: 11, fontFamily: "monospace" }}>
              {lat.toFixed(4)}, {lng.toFixed(4)} · {docId.slice(0, 8)}
            </span>
          </div>
        </div>
        {/* Clear chat */}
        {messages.length > 0 && (
          <button
            className="btn btn-ghost"
            style={{ padding: "5px 8px", borderRadius: 8, gap: 4, fontSize: 11.5 }}
            onClick={() => {
              if (confirm("Clear this chat history?")) {
                window.location.reload();
              }
            }}
            title="Clear chat"
          >
            <RotateCcw size={12} color="var(--text-3)" />
          </button>
        )}
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
                {/* Show typing dots when streaming but no content yet */}
                {msg.streaming && msg.content.length === 0 ? (
                  <TypingDots />
                ) : (
                  <p
                    style={{ color: "var(--text-1)", fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap" }}
                    className={msg.streaming && msg.content.length > 0 ? "typing-cursor" : ""}
                  >
                    {msg.content}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading dots when waiting for first chunk */}
        {loading && messages[messages.length - 1]?.role !== "ai" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <div className="flex-shrink-0 rounded-full flex items-center justify-center"
              style={{ width: 26, height: 26, background: "var(--accent-dim)", border: "1px solid rgba(0,194,255,0.15)" }}>
              <Bot size={13} color="var(--accent)" strokeWidth={2} />
            </div>
            <div className="bubble-ai">
              <TypingDots />
            </div>
          </motion.div>
        )}

        {/* Error state */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ margin: "4px 0", padding: "12px 14px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}>
            <p style={{ fontSize: 13, color: "var(--red)", fontWeight: 600, marginBottom: 4 }}>
              {error.includes("quota") || error.includes("429") ? "Rate limit hit" : "AI unavailable"}
            </p>
            <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}>
              {error.includes("quota") || error.includes("429")
                ? "Free Gemini API quota exceeded. Wait ~1 minute and try again."
                : error.includes("503") || error.includes("not set")
                ? "GEMINI_API_KEY not configured on server. Add it in Vercel → Environment Variables."
                : "Could not reach AI. Check your connection and try again."}
            </p>
            <button
              className="btn btn-outline"
              style={{ fontSize: 11.5, padding: "4px 12px", marginTop: 8, borderRadius: 6 }}
              onClick={handleRetry}
            >
              Retry
            </button>
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
