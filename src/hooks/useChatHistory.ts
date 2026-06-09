"use client";
/**
 * useChatHistory — persists AI chat messages per report (by docId) in localStorage.
 * Each report gets its own conversation saved under: civiclens_chat_<docId>
 */
import { useCallback } from "react";
import type { ChatMessage } from "./useChat";

const keyFor = (docId: string) => `civiclens_chat_${docId}`;
const MAX_MESSAGES = 100;

export function loadChatHistory(docId: string): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(keyFor(docId));
    if (!raw) return [];
    return JSON.parse(raw) as ChatMessage[];
  } catch {
    return [];
  }
}

export function saveChatHistory(docId: string, messages: ChatMessage[]): void {
  try {
    const trimmed = messages.slice(-MAX_MESSAGES);
    localStorage.setItem(keyFor(docId), JSON.stringify(trimmed));
  } catch {
    // localStorage quota — ignore
  }
}

export function clearChatHistory(docId: string): void {
  try {
    localStorage.removeItem(keyFor(docId));
  } catch { /* ignore */ }
}

export function useChatHistory(docId: string) {
  const save = useCallback(
    (messages: ChatMessage[]) => saveChatHistory(docId, messages),
    [docId]
  );
  const load = useCallback(() => loadChatHistory(docId), [docId]);
  const clear = useCallback(() => clearChatHistory(docId), [docId]);
  return { save, load, clear };
}
