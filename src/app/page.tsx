"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import ReportForm from "@/components/ReportForm";
import ChatInterface from "@/components/ChatInterface";
import { useUserId } from "@/hooks/useUserId";
import { Map, ArrowRight, CheckCircle, Copy, Check, User } from "lucide-react";

interface ReportData { imageUrl: string; lat: number; lng: number; docId: string; }

export default function HomePage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [copied, setCopied] = useState(false);
  const userId = useUserId();

  const copyId = () => {
    if (!userId) return;
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main style={{ minHeight: "100dvh" }}>
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-glow" aria-hidden="true" />

      {/* ── Nav ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(9,9,11,0.85)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: 56,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)" }} />
          <span className="font-display" style={{ color: "var(--text-1)", fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em" }}>
            CivicLens
          </span>
          <span style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", padding: "2px 6px",
            borderRadius: 4, background: "var(--accent-dim)", color: "var(--accent)",
            border: "1px solid rgba(0,194,255,0.18)", marginLeft: 2,
          }}>BETA</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* User ID chip */}
          {userId && (
            <button
              onClick={copyId}
              className="btn btn-ghost"
              style={{ gap: 5, padding: "5px 10px", fontSize: 12, fontFamily: "monospace" }}
              title="Your anonymous ID — click to copy"
            >
              <User size={11} color="var(--text-3)" />
              <span style={{ color: "var(--text-3)" }}>{userId}</span>
              {copied
                ? <Check size={11} color="var(--green)" />
                : <Copy size={11} color="var(--text-3)" />}
            </button>
          )}
          <Link href="/reports" className="btn btn-outline" style={{ fontSize: 13, gap: 6 }}>
            <Map size={13} strokeWidth={1.5} />
            Live map
          </Link>
        </div>
      </nav>

      {/* ── Content ── */}
      <div style={{
        paddingTop: 56, minHeight: "100dvh",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "80px 20px 48px",
      }}>
        <AnimatePresence mode="wait">
          {!reportData ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md flex flex-col gap-7"
            >
              {/* Hero */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="text-center"
              >
                <h1 className="font-display" style={{
                  fontSize: "clamp(26px, 6vw, 38px)",
                  letterSpacing: "-0.04em", lineHeight: 1.18,
                  color: "var(--text-1)", marginBottom: 12, fontWeight: 700,
                }}>
                  Report civic issues.<br />
                  <span style={{ color: "var(--accent)" }}>Get AI analysis.</span>
                </h1>
                <p style={{ color: "var(--text-2)", fontSize: 14.5, lineHeight: 1.7, maxWidth: 340, margin: "0 auto" }}>
                  Snap a photo and share your location. We log it and let Gemini AI assess the issue.
                </p>
              </motion.div>

              {/* Feature pills */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.12 }}
                style={{ display: "flex", justifyContent: "center", gap: 7, flexWrap: "wrap" }}
              >
                {["GPS accuracy ±3m", "Gemini AI", "Anonymous reports"].map((t) => (
                  <span key={t} style={{
                    fontSize: 12, color: "var(--text-3)",
                    padding: "4px 11px", borderRadius: 999,
                    border: "1px solid var(--border)", background: "var(--bg-2)",
                  }}>{t}</span>
                ))}
              </motion.div>

              <ReportForm onReportReady={setReportData} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38 }}
              className="w-full max-w-md flex flex-col gap-3"
            >
              {/* Success bar */}
              <div className="card flex items-start gap-3 p-4" style={{ borderColor: "rgba(34,197,94,0.2)" }}>
                <CheckCircle size={17} color="var(--green)" strokeWidth={2} style={{ marginTop: 1, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 13.5, color: "var(--text-1)", marginBottom: 3 }}>
                    Report submitted
                  </p>
                  <p style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5 }}>
                    Saved under your ID{" "}
                    <span style={{ fontFamily: "monospace", color: "var(--accent)", fontSize: 12 }}>
                      {userId}
                    </span>
                    . Visit{" "}
                    <Link href={`/reports?mine=true`} style={{ color: "var(--accent)", textDecoration: "underline" }}>
                      My Reports
                    </Link>{" "}
                    anytime to track status.
                  </p>
                </div>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: 12, padding: "4px 10px", flexShrink: 0 }}
                  onClick={() => setReportData(null)}
                >
                  New <ArrowRight size={11} />
                </button>
              </div>

              {/* User ID save reminder */}
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ delay: 0.3 }}
                className="card flex items-center gap-3 px-4 py-3"
                style={{ borderColor: "rgba(0,194,255,0.15)", background: "var(--accent-dim)" }}
              >
                <User size={14} color="var(--accent)" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11.5, color: "var(--text-2)" }}>Your anonymous tracking ID</p>
                  <p style={{ fontFamily: "monospace", fontSize: 13, color: "var(--text-1)", fontWeight: 600 }}>{userId}</p>
                </div>
                <button
                  className="btn btn-outline"
                  style={{ fontSize: 12, padding: "5px 11px", gap: 5 }}
                  onClick={copyId}
                >
                  {copied ? <Check size={12} color="var(--green)" /> : <Copy size={12} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </motion.div>

              <ChatInterface
                imageUrl={reportData.imageUrl}
                lat={reportData.lat}
                lng={reportData.lng}
                docId={reportData.docId}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
