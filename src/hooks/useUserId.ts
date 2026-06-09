"use client";
import { useEffect, useState } from "react";

const STORAGE_KEY = "civiclens_user_id";

function generateId(): string {
  // Use crypto.randomUUID if available, otherwise fallback
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return "CL-" + crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  }
  return "CL-" + Math.random().toString(36).slice(2, 10).toUpperCase();
}

export function useUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = generateId();
      localStorage.setItem(STORAGE_KEY, id);
    }
    setUserId(id);
  }, []);

  return userId;
}

/** Read userId synchronously (only call on client) */
export function getUserId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
