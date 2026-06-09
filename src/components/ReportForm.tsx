"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useImgBBUpload } from "@/hooks/useImgBBUpload";
import { getUserId } from "@/hooks/useUserId";
import { useLocalReports } from "@/hooks/useLocalReports";
import LoadingSpinner from "./LoadingSpinner";
import UploadAnimation from "./UploadAnimation";
import GlassCard from "./GlassCard";
import toast from "react-hot-toast";
import {
  MapPin, Camera, AlertTriangle, ArrowLeft,
  Upload, CheckCircle, ChevronRight, X
} from "lucide-react";

interface ReportFormProps {
  onReportReady: (data: { imageUrl: string; lat: number; lng: number; docId: string }) => void;
}

type Step = "idle" | "locating" | "located" | "uploading" | "done";

export default function ReportForm({ onReportReady }: ReportFormProps) {
  const [step, setStep] = useState<Step>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [uploadDone, setUploadDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { location, loading: geoLoading, error: geoError, fetch: fetchLocation } = useGeolocation();
  const { upload, progress, uploading, error: uploadError } = useImgBBUpload();
  const { saveReport } = useLocalReports();

  const handleStartReport = useCallback(() => {
    setStep("locating");
    fetchLocation();
  }, [fetchLocation]);

  useEffect(() => {
    if (!geoLoading && location && step === "locating") {
      setStep("located");
    }
  }, [geoLoading, location, step]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large. Max 20 MB.");
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedFile || !location) return;
    setStep("uploading");
    setUploadDone(false);

    const downloadURL = await upload(selectedFile);
    if (!downloadURL) {
      toast.error(uploadError || "Upload failed. Try again.");
      setStep("located");
      return;
    }

    setUploadDone(true);
    // Brief pause so user sees the "done" state of the animation
    await new Promise((r) => setTimeout(r, 700));

    try {
      const uid = getUserId();
      const now = new Date();
      const docRef = await addDoc(collection(db, "reports"), {
        imageUrl: downloadURL,
        lat: location.lat,
        lng: location.lng,
        description: description.trim() || "No description provided",
        status: "pending",
        userId: uid,
        createdAt: serverTimestamp(),
      });

      // Always save to localStorage — survives Firestore rule changes & page refreshes
      saveReport({
        id: docRef.id,
        imageUrl: downloadURL,
        lat: location.lat,
        lng: location.lng,
        description: description.trim() || "No description provided",
        status: "pending",
        userId: uid,
        createdAt: now,
      });
      toast.success("Report submitted successfully");
      setStep("done");
      onReportReady({ imageUrl: downloadURL, lat: location.lat, lng: location.lng, docId: docRef.id });
    } catch {
      toast.error("Failed to save report. Check your Firestore rules.");
      setStep("located");
    }
  }, [selectedFile, location, upload, description, uploadError, onReportReady]);

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">

        {/* ── IDLE ── */}
        {step === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <GlassCard className="p-8 text-center" accent animate={false}>
              <div style={{
                margin: "0 auto 20px",
                width: 52, height: 52,
                borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
                background: "var(--accent-dim)", border: "1px solid rgba(0,194,255,0.18)",
              }}>
                <MapPin size={22} color="var(--accent)" strokeWidth={1.5} />
              </div>
              <h2 className="font-display" style={{ fontSize: 19, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em", marginBottom: 8 }}>
                Report a civic issue
              </h2>
              <p style={{ color: "var(--text-2)", fontSize: 14, lineHeight: 1.65, marginBottom: 24 }}>
                Capture your location and a photo. We&apos;ll log it to the city database with AI analysis.
              </p>
              <button id="btn-start-report" className="btn btn-accent" style={{ width: "100%" }} onClick={handleStartReport}>
                <MapPin size={14} strokeWidth={2} />
                Get my location
                <ChevronRight size={14} />
              </button>
            </GlassCard>
          </motion.div>
        )}

        {/* ── LOCATING ── */}
        {step === "locating" && (
          <motion.div key="locating" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <GlassCard className="p-10 flex flex-col items-center gap-5" animate={false}>
              {geoError ? (
                <>
                  <div style={{
                    width: 46, height: 46, borderRadius: 12,
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <AlertTriangle size={20} color="var(--red)" strokeWidth={1.5} />
                  </div>
                  <p style={{ color: "var(--text-2)", fontSize: 13.5, textAlign: "center" }}>{geoError}</p>
                  <button className="btn btn-outline" onClick={() => setStep("idle")}>
                    <ArrowLeft size={13} /> Go back
                  </button>
                </>
              ) : (
                <>
                  <LoadingSpinner size="md" />
                  <div style={{ textAlign: "center" }}>
                    <p style={{ color: "var(--text-1)", fontSize: 14, fontWeight: 500 }}>Fetching location</p>
                    <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>Allow location access when prompted</p>
                  </div>
                </>
              )}
            </GlassCard>
          </motion.div>
        )}

        {/* ── LOCATED ── */}
        {step === "located" && location && (
          <motion.div key="located" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="flex flex-col gap-3">

            {/* Location row */}
            <GlassCard className="px-4 py-3 flex items-center gap-3" animate={false}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: "var(--green-dim)", display: "flex", alignItems: "center", justifyContent: "center",
                border: "1px solid rgba(34,197,94,0.15)",
              }}>
                <CheckCircle size={15} color="var(--green)" strokeWidth={2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, color: "var(--text-3)" }}>Location captured</p>
                <p style={{ fontFamily: "monospace", fontSize: 13, color: "var(--text-1)" }}>
                  {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                </p>
              </div>
            </GlassCard>

            {/* Photo upload card */}
            <GlassCard className="p-5 flex flex-col gap-4" animate={false}>
              <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-1)" }}>Add a photo</p>

              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {preview ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: "16/9", border: "1px solid var(--border)" }}
                >
                  <Image src={preview} alt="Preview" fill style={{ objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: 8, gap: 6 }}>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: "5px 10px", fontSize: 11.5, background: "rgba(0,0,0,0.65)", color: "white", borderRadius: 6 }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: "5px", background: "rgba(0,0,0,0.65)", borderRadius: 6 }}
                      onClick={() => { setPreview(null); setSelectedFile(null); }}
                    >
                      <X size={13} color="white" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <button
                  id="btn-choose-photo"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: "100%", aspectRatio: "16/9", borderRadius: 10,
                    border: "1.5px dashed var(--border)", background: "var(--bg-3)",
                    cursor: "pointer", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 10,
                    transition: "border-color 0.15s ease, background 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border-focus)";
                    (e.currentTarget as HTMLElement).style.background = "var(--accent-dim)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLElement).style.background = "var(--bg-3)";
                  }}
                >
                  <Camera size={24} color="var(--text-3)" strokeWidth={1.5} />
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-2)" }}>Take a photo or upload from gallery</p>
                    <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>PNG, JPG, HEIC — up to 20 MB</p>
                  </div>
                </button>
              )}

              <textarea
                id="description-input"
                className="input resize-none"
                rows={3}
                placeholder="Describe the issue (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <button
                id="btn-submit-report"
                className="btn btn-accent"
                style={{ width: "100%" }}
                onClick={handleSubmit}
                disabled={!selectedFile || uploading}
              >
                <Upload size={14} strokeWidth={2} />
                Submit report
              </button>
            </GlassCard>
          </motion.div>
        )}

        {/* ── UPLOADING — full-screen beautiful animation ── */}
        {step === "uploading" && (
          <motion.div key="uploading" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <GlassCard animate={false} accent>
              <UploadAnimation progress={progress} done={uploadDone} />
            </GlassCard>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
