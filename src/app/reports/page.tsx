"use client";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, onSnapshot, orderBy, query, deleteDoc, doc } from "firebase/firestore";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { useUserId } from "@/hooks/useUserId";
import { useLocalReports } from "@/hooks/useLocalReports";
import { getRegionalPWD, getRegionalPWDNumber, buildPWDWhatsAppUrl } from "@/lib/pwdRouter";
import GlassCard from "@/components/GlassCard";
import StatusBadge from "@/components/StatusBadge";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { ReportPin } from "@/components/ReportsMap";
import {
  ArrowLeft, AlertCircle, Copy, Check, User,
  Trash2, Send, MapPin, X, MessageCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const ReportsMap = dynamic(() => import("@/components/ReportsMap"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "100%", background: "var(--bg-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <LoadingSpinner message="Loading map…" />
    </div>
  ),
});

type Filter = "all" | "pending" | "reviewed" | "resolved" | "mine";
type ExtendedPin = ReportPin & { userId?: string };

/* ── PWD WhatsApp helper — uses regional router ── */
function openPWDWhatsApp(r: ExtendedPin): void {
  const number = getRegionalPWDNumber(r.lat, r.lng);
  const url = buildPWDWhatsAppUrl(number, {
    description: r.description,
    lat: r.lat,
    lng: r.lng,
    imageUrl: r.imageUrl,
    status: r.status,
    createdAt: r.createdAt,
  });
  window.open(url, "_blank", "noopener,noreferrer");
}

/* ── Forward Modal ── */
function ForwardModal({ report, onClose }: { report: ExtendedPin; onClose: () => void }) {
  const mapsUrl = `https://maps.google.com/?q=${report.lat},${report.lng}`;
  const region = getRegionalPWD(report.lat, report.lng);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-2)", border: "1px solid var(--border)",
          borderRadius: 16, width: "100%", maxWidth: 440,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid var(--border)",
        }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, color: "var(--text-1)" }}>Forward to PWD</p>
            <p style={{ fontSize: 12, color: "var(--accent)", marginTop: 2, fontWeight: 500 }}>
              {region.label}
            </p>
          </div>
          <button className="btn btn-ghost" style={{ padding: 7, borderRadius: 8 }} onClick={onClose}>
            <X size={15} color="var(--text-2)" />
          </button>
        </div>

        {/* Report preview */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          {report.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={report.imageUrl}
              alt="Report"
              style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 10, marginBottom: 14 }}
            />
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <StatusBadge status={report.status} />
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                {report.createdAt?.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
            <p style={{ fontSize: 13.5, color: "var(--text-1)", lineHeight: 1.55 }}>
              {report.description}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <MapPin size={12} color="var(--text-3)" />
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, color: "var(--accent)", fontFamily: "monospace", textDecoration: "none" }}
              >
                {report.lat.toFixed(5)}, {report.lng.toFixed(5)} ↗
              </a>
            </div>
          </div>
        </div>

        {/* Message preview */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <p style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 500 }}>Message preview</p>
            <span style={{
              fontSize: 10, color: "var(--accent)", fontFamily: "monospace",
              background: "var(--accent-dim)", padding: "2px 7px", borderRadius: 4,
              border: "1px solid rgba(0,194,255,0.15)",
            }}>
              → +{region.number}
            </span>
          </div>
          <div style={{
            background: "var(--bg-3)", borderRadius: 8, padding: "10px 12px",
            fontSize: 11.5, color: "var(--text-2)", lineHeight: 1.7, fontFamily: "monospace",
            whiteSpace: "pre-wrap", maxHeight: 150, overflowY: "auto",
          }}>
            {[
              `🚨 URGENT CIVIC ISSUE ALERT`,
              `━━━━━━━━━━━━━━━━━━━━`,
              ``,
              `📋 Issue: ${report.description.slice(0, 80)}${report.description.length > 80 ? "…" : ""}`,
              ``,
              `📍 ${report.lat.toFixed(6)}, ${report.lng.toFixed(6)}`,
              `🗺️  maps.google.com/?q=${report.lat},${report.lng}`,
              ``,
              `📸 ${report.imageUrl ? "[Photo evidence attached]" : "No photo"}`,
              ``,
              `🔴 Status: Pending Review`,
              `📅 ${report.createdAt?.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) ?? "Date unknown"}`,
            ].join("\n")}
          </div>
        </div>

        {/* Action */}
        <div style={{ padding: "16px 20px" }}>
          <button
            className="btn btn-accent"
            style={{ width: "100%", gap: 8, fontSize: 14 }}
            onClick={() => openPWDWhatsApp(report)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Send to PWD via WhatsApp
          </button>
          <p style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>
            Opens a direct WhatsApp chat with <strong style={{ color: "var(--text-2)" }}>{region.label}</strong> pre-loaded with the full report. Just hit send.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Delete confirmation inline ── */
function DeleteButton({ onConfirm }: { onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div style={{ display: "flex", gap: 5 }}>
        <button
          className="btn"
          style={{ padding: "4px 10px", fontSize: 11.5, background: "var(--red)", color: "#fff", borderRadius: 7 }}
          onClick={onConfirm}
        >
          Delete
        </button>
        <button
          className="btn btn-ghost"
          style={{ padding: "4px 8px", fontSize: 11.5, borderRadius: 7 }}
          onClick={() => setConfirming(false)}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      className="btn btn-ghost"
      style={{ padding: "4px 8px", borderRadius: 7 }}
      onClick={() => setConfirming(true)}
      title="Delete this report"
    >
      <Trash2 size={13} color="var(--red)" />
    </button>
  );
}

/* ── Main page ── */
function ReportsContent() {
  const searchParams = useSearchParams();
  const userId = useUserId();
  const router = useRouter();
  const { mergeWithFirestore, deleteReport: deleteLocalReport } = useLocalReports();
  const [firestoreReports, setFirestoreReports] = useState<ExtendedPin[]>([]);
  const [reports, setReports] = useState<ExtendedPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>(searchParams.get("mine") === "true" ? "mine" : "all");
  const [copied, setCopied] = useState(false);
  const [forwardReport, setForwardReport] = useState<ExtendedPin | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && searchParams.get("mine") === "true") {
      setFilter("mine");
      initialized.current = true;
    }
  }, [searchParams]);

  useEffect(() => {
    const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data: ExtendedPin[] = snap.docs.map((d) => {
          const r = d.data();
          return {
            id: d.id,
            lat: r.lat,
            lng: r.lng,
            imageUrl: r.imageUrl || "",
            description: r.description || "No description",
            status: r.status || "pending",
            createdAt: r.createdAt?.toDate?.() ?? null,
            userId: r.userId || null,
          };
        });
        setFirestoreReports(data);
        setLoading(false);
        setFirestoreError(null);
      },
      (err) => {
        setFirestoreError(
          err.code === "permission-denied"
            ? "Firestore rules block reads. Your local reports are shown below."
            : err.message
        );
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Merge Firestore + local reports whenever either changes
  useEffect(() => {
    setReports(mergeWithFirestore(firestoreReports as unknown as import("@/hooks/useLocalReports").LocalReport[]) as ExtendedPin[]);
  }, [firestoreReports, mergeWithFirestore]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, "reports", id));
      deleteLocalReport(id);
      toast.success("Report deleted");
    } catch {
      // If Firestore delete fails (rules), at least remove locally
      deleteLocalReport(id);
      toast.success("Removed from your local view");
    }
  }, [deleteLocalReport]);

  const getFiltered = () => {
    if (filter === "mine") return reports.filter((r) => r.userId === userId);
    if (filter === "all") return reports;
    return reports.filter((r) => r.status === filter);
  };
  const filtered = getFiltered();

  const counts = {
    all: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    reviewed: reports.filter((r) => r.status === "reviewed").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    mine: userId ? reports.filter((r) => r.userId === userId).length : 0,
  };

  const formatDate = useCallback((date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }, []);

  const copyId = () => {
    if (!userId) return;
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filterTabs: { key: Filter; label: string }[] = [
    { key: "all",      label: "All"      },
    { key: "mine",     label: "Mine"     },
    { key: "pending",  label: "Pending"  },
    { key: "reviewed", label: "Reviewed" },
    { key: "resolved", label: "Resolved" },
  ];

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <div className="bg-grid" aria-hidden="true" />

      {/* Forward modal */}
      <AnimatePresence>
        {forwardReport && (
          <ForwardModal report={forwardReport} onClose={() => setForwardReport(null)} />
        )}
      </AnimatePresence>

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(9,9,11,0.88)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: 56,
      }}>
        <Link href="/" className="btn btn-ghost" style={{ fontSize: 13, gap: 5, padding: "6px 10px" }}>
          <ArrowLeft size={13} strokeWidth={1.5} />
          Back
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)" }} />
          <span className="font-display" style={{ color: "var(--text-1)", fontSize: 14, fontWeight: 600, letterSpacing: "-0.02em" }}>
            CivicLens
          </span>
        </div>
        <Link href="/" className="btn btn-accent" style={{ fontSize: 13, padding: "7px 14px" }}>
          + Report
        </Link>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 56px" }} className="flex flex-col gap-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display" style={{ fontSize: 22, letterSpacing: "-0.03em", color: "var(--text-1)", fontWeight: 700, marginBottom: 4 }}>
            Live reports
          </h1>
          <p style={{ color: "var(--text-2)", fontSize: 13.5 }}>
            Real-time civic issue feed
            {!loading && <span style={{ color: "var(--text-3)", marginLeft: 8 }}>· {reports.length} total</span>}
          </p>
        </motion.div>

        {/* User ID card */}
        {userId && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="card flex items-center gap-3 px-4 py-3" style={{ borderColor: "rgba(0,194,255,0.14)" }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: "var(--accent-dim)", border: "1px solid rgba(0,194,255,0.14)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <User size={14} color="var(--accent)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 10.5, color: "var(--text-3)", marginBottom: 1 }}>Your anonymous ID</p>
                <p style={{ fontFamily: "monospace", fontSize: 13, color: "var(--text-1)", fontWeight: 600 }}>{userId}</p>
              </div>
              <button className="btn btn-outline" style={{ fontSize: 12, padding: "5px 11px", gap: 5 }} onClick={copyId}>
                {copied ? <Check size={12} color="var(--green)" /> : <Copy size={12} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button className="btn btn-accent" style={{ fontSize: 12, padding: "5px 12px" }} onClick={() => setFilter("mine")}>
                My reports {counts.mine > 0 && `(${counts.mine})`}
              </button>
            </div>
          </motion.div>
        )}

        {/* Firestore error */}
        {firestoreError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card flex items-start gap-3 p-4" style={{ borderColor: "rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.04)" }}>
            <AlertCircle size={15} color="var(--red)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontWeight: 600, fontSize: 13, color: "var(--red)", marginBottom: 4 }}>Database error</p>
              <p style={{ fontSize: 12.5, color: "var(--text-2)" }}>{firestoreError}</p>
              <code style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginTop: 6, fontFamily: "monospace" }}>
                Firebase Console → Firestore → Rules → allow read, write: if true;
              </code>
            </div>
          </motion.div>
        )}

        {/* Filter tabs */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {filterTabs.map(({ key, label }) => {
            const active = filter === key;
            const isMine = key === "mine";
            return (
              <button
                key={key} id={`filter-${key}`} onClick={() => setFilter(key)}
                className="card stat-card"
                style={{
                  flex: "1 1 75px", minWidth: 75,
                  borderColor: active ? (isMine ? "rgba(0,194,255,0.4)" : "rgba(255,255,255,0.16)") : "var(--border)",
                  background: active ? (isMine ? "var(--accent-dim)" : "var(--bg-3)") : "var(--bg-2)",
                  cursor: "pointer", transition: "all 0.15s ease",
                }}
              >
                <span className="font-display" style={{
                  fontSize: 22, letterSpacing: "-0.03em", lineHeight: 1,
                  color: active && isMine ? "var(--accent)" : "var(--text-1)",
                }}>
                  {counts[key]}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{label}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Map */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          style={{ height: 360, borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg-2)" }}>
          <ReportsMap reports={filtered} />
        </motion.div>

        {/* Report cards */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 500 }}>
              {filter === "all" ? "All reports" : filter === "mine" ? "My reports" :
               `${filter.charAt(0).toUpperCase() + filter.slice(1)} reports`}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>({filtered.length})</span>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
              <LoadingSpinner message="Loading…" />
            </div>
          ) : filtered.length === 0 ? (
            <GlassCard className="p-12 text-center">
              {filter === "mine" ? (
                <>
                  <p style={{ color: "var(--text-3)", fontSize: 14, marginBottom: 8 }}>No reports under your ID yet.</p>
                  <Link href="/" style={{ color: "var(--accent)", fontSize: 13 }}>Submit your first report →</Link>
                </>
              ) : (
                <p style={{ color: "var(--text-3)", fontSize: 14 }}>
                  No reports yet.{" "}
                  <Link href="/" style={{ color: "var(--accent)" }}>Be the first.</Link>
                </p>
              )}
            </GlassCard>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 10 }}>
              {filtered.map((report, i) => {
                const isOwn = report.userId === userId;
                return (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ delay: i * 0.04, duration: 0.28 }}
                    layout
                  >
                    <GlassCard className="overflow-hidden flex flex-col" animate={false} hoverable accent={isOwn}>
                      {/* Image */}
                      {report.imageUrl && (
                        <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden", flexShrink: 0 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={report.imageUrl}
                            alt="Report"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            loading="lazy"
                          />
                          {isOwn && (
                            <div style={{
                              position: "absolute", top: 8, left: 8,
                              background: "var(--accent)", borderRadius: 5,
                              padding: "2px 8px", fontSize: 10, fontWeight: 700, color: "#000",
                            }}>
                              Mine
                            </div>
                          )}
                        </div>
                      )}

                      {/* Body */}
                      <div style={{ padding: "13px 14px", display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <StatusBadge status={report.status} />
                          <span style={{ color: "var(--text-3)", fontSize: 11.5 }}>{formatDate(report.createdAt)}</span>
                        </div>
                        <p style={{
                          color: "var(--text-2)", fontSize: 13, lineHeight: 1.55,
                          display: "-webkit-box", WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical", overflow: "hidden",
                        }}>
                          {report.description}
                        </p>
                        <p style={{ color: "var(--text-3)", fontSize: 11, fontFamily: "monospace", marginTop: "auto" }}>
                          {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
                        </p>

                        {/* Actions */}
                        <div style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          paddingTop: 8, borderTop: "1px solid var(--border)", marginTop: 2,
                          gap: 6,
                        }}>
                          {/* Chat with AI */}
                          <button
                            className="btn btn-ghost"
                            style={{ padding: "4px 10px", fontSize: 12, gap: 5, borderRadius: 7 }}
                            onClick={() => {
                              try {
                                sessionStorage.setItem("civiclens_active_report", JSON.stringify({
                                  imageUrl: report.imageUrl,
                                  lat: report.lat,
                                  lng: report.lng,
                                  docId: report.id,
                                }));
                              } catch { /* ignore */ }
                              router.push("/");
                            }}
                            title="Chat with AI about this report"
                          >
                            <MessageCircle size={12} color="#a78bfa" />
                            <span style={{ color: "#a78bfa" }}>Chat with AI</span>
                          </button>

                          {/* Forward to PWD */}
                          <button
                            className="btn btn-ghost"
                            style={{ padding: "4px 10px", fontSize: 12, gap: 5, borderRadius: 7 }}
                            onClick={() => setForwardReport(report)}
                            title="Forward to PWD via WhatsApp"
                          >
                            <Send size={12} color="var(--accent)" />
                            <span style={{ color: "var(--accent)" }}>Forward</span>
                          </button>

                          {/* Delete (own reports only) */}
                          {isOwn && (
                            <DeleteButton onConfirm={() => handleDelete(report.id)} />
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingSpinner message="Loading…" />
      </div>
    }>
      <ReportsContent />
    </Suspense>
  );
}
