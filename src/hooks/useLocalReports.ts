"use client";
/**
 * useLocalReports — persists submitted reports to localStorage
 * so the user can always see their own reports even if Firestore
 * rules block reads on other devices or after a rules change.
 *
 * localStorage key: civiclens_reports
 * Each entry mirrors the Firestore report shape.
 */
import { useCallback, useEffect, useState } from "react";

export interface LocalReport {
  id: string;             // Firestore docId
  lat: number;
  lng: number;
  imageUrl: string;
  description: string;
  status: string;
  createdAt: Date | null;
  userId: string;
  savedAt: number;        // timestamp for sorting
}

const KEY = "civiclens_reports";
const MAX_LOCAL = 50; // keep up to 50 reports locally

function loadAll(): LocalReport[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<LocalReport & { createdAt: string | null; savedAt: number }>;
    return parsed.map((r) => ({
      ...r,
      createdAt: r.createdAt ? new Date(r.createdAt) : null,
    }));
  } catch {
    return [];
  }
}

function saveAll(reports: LocalReport[]): void {
  try {
    // Keep newest MAX_LOCAL
    const trimmed = [...reports]
      .sort((a, b) => b.savedAt - a.savedAt)
      .slice(0, MAX_LOCAL);
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage quota exceeded — ignore
  }
}

export function useLocalReports() {
  const [localReports, setLocalReports] = useState<LocalReport[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setLocalReports(loadAll());
    setIsLoaded(true);
  }, []);

  const saveReport = useCallback((report: Omit<LocalReport, "savedAt">) => {
    const entry: LocalReport = { ...report, savedAt: Date.now() };
    setLocalReports((prev) => {
      // Replace if exists (e.g. status update), else prepend
      const filtered = prev.filter((r) => r.id !== report.id);
      const next = [entry, ...filtered];
      saveAll(next);
      return next;
    });
  }, []);

  const deleteReport = useCallback((id: string) => {
    setLocalReports((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveAll(next);
      return next;
    });
  }, []);

  /**
   * Merge Firestore reports with local ones.
   * Firestore is source of truth for shared reports.
   * Local-only reports (not in Firestore yet / Firestore blocked) are appended.
   */
  const mergeWithFirestore = useCallback(
    (firestoreReports: LocalReport[]): LocalReport[] => {
      if (firestoreReports.length === 0) {
        // Firestore blocked — show local reports only
        return localReports;
      }
      const firestoreIds = new Set(firestoreReports.map((r) => r.id));
      const localOnly = localReports.filter((r) => !firestoreIds.has(r.id));
      const all = [
        ...(firestoreReports as unknown as LocalReport[]),
        ...localOnly,
      ];
      return all.sort(
        (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
      );
    },
    [localReports]
  );

  return { localReports, isLoaded, saveReport, deleteReport, mergeWithFirestore };
}
