"use client";
import { useState, useCallback, useRef } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  streaming?: boolean;
}

export interface UseChatResult {
  messages: ChatMessage[];
  sendMessage: (text: string, imageUrl?: string, lat?: number, lng?: number) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useChat(
  initialMessages: ChatMessage[] = [],
  onMessagesChange?: (msgs: ChatMessage[]) => void
): UseChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<ChatMessage[]>(initialMessages);

  const updateMessages = useCallback(
    (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
      setMessages((prev) => {
        const next = updater(prev);
        messagesRef.current = next;
        // Persist to localStorage via callback (non-streaming messages only)
        const stable = next.filter((m) => !m.streaming);
        onMessagesChange?.(stable);
        return next;
      });
    },
    [onMessagesChange]
  );

  const sendMessage = useCallback(
    async (text: string, imageUrl?: string, lat?: number, lng?: number) => {
      setError(null);

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
      };
      updateMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      const history = messagesRef.current.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const aiMsgId = `ai-${Date.now()}`;
      const aiPlaceholder: ChatMessage = {
        id: aiMsgId,
        role: "ai",
        content: "",
        streaming: true,
      };
      updateMessages((prev) => [...prev, aiPlaceholder]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, imageUrl, lat, lng, history }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server error ${res.status}`);
        }

        if (!res.body) throw new Error("No response body from server");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          updateMessages((prev) =>
            prev.map((m) => (m.id === aiMsgId ? { ...m, content: accumulated } : m))
          );
        }

        // Mark streaming done
        updateMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, streaming: false } : m))
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to get AI response";
        setError(msg);
        updateMessages((prev) => prev.filter((m) => m.id !== aiMsgId));
      } finally {
        setLoading(false);
      }
    },
    [updateMessages]
  );

  return { messages, sendMessage, loading, error };
}
