"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReportForm from "@/components/ReportForm";
import ChatInterface from "@/components/ChatInterface";
import { useUserId } from "@/hooks/useUserId";
import {
  Map, ArrowRight, CheckCircle, Copy, Check, User,
  Info, X, MapPin, MessageSquare, Send, Camera, ChevronRight,
  MessageCircle
} from "lucide-react";

interface ReportData { imageUrl: string; lat: number; lng: number; docId: string; }

const SESSION_KEY = "civiclens_active_report";

/* ─── About Modal ─── */
function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px", overflowY: "auto",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-2)", border: "1px solid var(--border)",
          borderRadius: 20, width: "100%", maxWidth: 480,
          overflow: "hidden", maxHeight: "90dvh", overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "20px 24px 16px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
          position: "sticky", top: 0, background: "var(--bg-2)", zIndex: 1,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 8px var(--accent)" }} />
              <span className="font-display" style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em" }}>CivicLens</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--accent)", fontStyle: "italic", fontWeight: 500 }}>Your City. Your Voice. Instant Impact.</p>
          </div>
          <button className="btn btn-ghost" style={{ padding: 8, borderRadius: 10, flexShrink: 0 }} onClick={onClose}>
            <X size={16} color="var(--text-2)" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
          <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.75 }}>
            We believe that reporting civic issues shouldn&apos;t feel like a chore. CivicLens is built to bridge the gap between citizens and local authorities, making it incredibly simple to report potholes, broken streetlights, and road hazards in just a few taps.
          </p>
          <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.75 }}>
            No long forms, no complicated portals — just a seamless experience designed to keep our streets safe and beautiful.
          </p>

          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", marginBottom: 14, letterSpacing: "0.05em", textTransform: "uppercase" }}>How It Works</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { icon: <Camera size={16} color="var(--accent)" />, bg: "var(--accent-dim)", border: "rgba(0,194,255,0.15)", title: "Snap a Photo", desc: "See an issue? Just click a picture or upload one from your gallery." },
                { icon: <MapPin size={16} color="var(--green)" />, bg: "var(--green-dim)", border: "rgba(34,197,94,0.15)", title: "Pinpoint Accuracy", desc: "You don't need to type out long addresses. The app automatically detects the exact location of the problem." },
                { icon: <MessageSquare size={16} color="#a78bfa" />, bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.18)", title: "Smart Chat Assistant", desc: "Instead of filling out boring details, our friendly smart assistant chats with you to understand the situation better." },
                { icon: <Send size={16} color="#f59e0b" />, bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.18)", title: "Direct Action", desc: "Forward it directly to local authorities via WhatsApp with image, exact map location, and clear summary." },
              ].map(({ icon, bg, border, title, desc }) => (
                <div key={title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>{icon}</div>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-1)", marginBottom: 3 }}>{title}</p>
                    <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.65 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderRadius: 14, border: "1px solid rgba(0,194,255,0.12)", background: "var(--accent-dim)", padding: "16px 18px" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase" }}>Why Use CivicLens?</p>
            <p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.75 }}>
              Our goal is to empower you to drive real change in your neighborhood. By turning a complicated reporting process into a quick, conversational chat, we ensure your voice reaches the right people, at the right time, with exactly the right information.
            </p>
          </div>

          <button className="btn btn-accent" style={{ width: "100%", marginTop: 4 }} onClick={onClose}>
            Start Reporting <ChevronRight size={14} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main Page ─── */
export default function HomePage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const userId = useUserId();
  const router = useRouter();
  // Only open chat if explicitly requested via ?chat=1 (from report card)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("chat") !== "1") return;
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        setReportData(JSON.parse(saved));
        setShowChat(true);
        // Clean URL without reload
        window.history.replaceState({}, "", "/");
      }
    } catch { /* ignore */ }
  }, []);

  const handleReportReady = (data: ReportData) => {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch { /* ignore */ }
    setReportData(data);
    // Take user directly to their reports — they can chat from the card
    router.push("/reports?mine=true");
  };

  const handleNewReport = () => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    setReportData(null);
    setShowChat(false);
  };

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

      <AnimatePresence>{showAbout && <AboutModal onClose={() => setShowAbout(false)} />}</AnimatePresence>

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
          <span className="font-display" style={{ color: "var(--text-1)", fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em" }}>CivicLens</span>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", padding: "2px 6px", borderRadius: 4, background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid rgba(0,194,255,0.18)", marginLeft: 2 }}>BETA</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {userId && (
            <button onClick={copyId} className="btn btn-ghost" style={{ gap: 5, padding: "5px 10px", fontSize: 12, fontFamily: "monospace" }} title="Your anonymous ID — click to copy">
              <User size={11} color="var(--text-3)" />
              <span style={{ color: "var(--text-3)" }}>{userId}</span>
              {copied ? <Check size={11} color="var(--green)" /> : <Copy size={11} color="var(--text-3)" />}
            </button>
          )}
          <button className="btn btn-ghost" style={{ gap: 5, padding: "5px 10px", fontSize: 13 }} onClick={() => setShowAbout(true)}>
            <Info size={14} strokeWidth={1.5} /> About
          </button>
          <Link href="/reports" className="btn btn-outline" style={{ fontSize: 13, gap: 6 }}>
            <Map size={13} strokeWidth={1.5} /> Live map
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

          {/* ── FORM VIEW ── */}
          {!reportData && (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-md flex flex-col gap-7">
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="text-center">
                <h1 className="font-display" style={{ fontSize: "clamp(26px, 6vw, 38px)", letterSpacing: "-0.04em", lineHeight: 1.18, color: "var(--text-1)", marginBottom: 12, fontWeight: 700 }}>
                  Report civic issues.<br />
                  <span style={{ color: "var(--accent)" }}>Get AI analysis.</span>
                </h1>
                <p style={{ color: "var(--text-2)", fontSize: 14.5, lineHeight: 1.7, maxWidth: 340, margin: "0 auto" }}>
                  Snap a photo and share your location. We log it and let Gemini AI assess the issue.
                </p>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }} style={{ display: "flex", justifyContent: "center", gap: 7, flexWrap: "wrap" }}>
                {["GPS accuracy ±3m", "Gemini AI", "Anonymous reports"].map((t) => (
                  <span key={t} style={{ fontSize: 12, color: "var(--text-3)", padding: "4px 11px", borderRadius: 999, border: "1px solid var(--border)", background: "var(--bg-2)" }}>{t}</span>
                ))}
              </motion.div>

              <ReportForm onReportReady={handleReportReady} />

              {/* My Reports shortcut — visible on home screen after refresh */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <Link
                  href="/reports?mine=true"
                  className="btn btn-ghost"
                  style={{ width: "100%", gap: 8, fontSize: 13.5, padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border)", textDecoration: "none", justifyContent: "center" }}
                >
                  <Map size={14} strokeWidth={1.5} color="var(--text-3)" />
                  <span style={{ color: "var(--text-2)" }}>View my previous reports</span>
                  <ArrowRight size={13} color="var(--text-3)" />
                </Link>
              </motion.div>
            </motion.div>
          )}

          {/* ── POST-SUBMIT: Redirecting view ── */}
          {reportData && !showChat && (
            <motion.div key="redirecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center gap-4 py-10">
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                border: "2px solid var(--border)", borderTopColor: "var(--accent)",
                animation: "spin 1s linear infinite"
              }} />
              <p style={{ color: "var(--text-2)", fontSize: 14 }}>Redirecting to your reports...</p>
            </motion.div>
          )}

          {/* ── CHAT VIEW ── */}
          {reportData && showChat && (
            <motion.div key="chat" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-md flex flex-col gap-3">
              {/* Back to reports list */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  className="btn btn-ghost"
                  style={{ gap: 6, fontSize: 13, padding: "6px 12px" }}
                  onClick={() => router.push("/reports?mine=true")}
                >
                  ← Back
                </button>
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>Report submitted • Chat with AI</span>
                <Link href="/reports?mine=true" className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 10px", marginLeft: "auto", gap: 5 }}>
                  <Map size={12} /> My Reports
                </Link>
              </div>

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
