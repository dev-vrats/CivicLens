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

export function useChat(): UseChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Keep a stable ref of messages for the closure inside sendMessage
  const messagesRef = useRef<ChatMessage[]>([]);

  const updateMessages = (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    setMessages((prev) => {
      const next = updater(prev);
      messagesRef.current = next;
      return next;
    });
  };

  const sendMessage = useCallback(
    async (text: string, imageUrl?: string, lat?: number, lng?: number) => {
      setError(null);

      // Add user message
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
      };
      updateMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      // Build history for context (exclude the message we just added)
      const history = messagesRef.current.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Create a placeholder AI message for streaming
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
          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;

          // Update the streaming AI message in place
          updateMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId ? { ...m, content: accumulated } : m
            )
          );
        }

        // Mark streaming as done
        updateMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId ? { ...m, streaming: false } : m
          )
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to get AI response";
        setError(msg);
        // Remove the empty placeholder on error
        updateMessages((prev) => prev.filter((m) => m.id !== aiMsgId));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { messages, sendMessage, loading, error };
}
