"use client";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Camera, Upload, CheckCircle } from "lucide-react";

interface UploadAnimationProps {
  progress: number; // 0–100
  done?: boolean;
}

const RADIUS = 54;
const CIRC = 2 * Math.PI * RADIUS;

export default function UploadAnimation({ progress, done = false }: UploadAnimationProps) {
  const motionProgress = useMotionValue(0);
  const strokeDash = useTransform(motionProgress, (v) => `${(v / 100) * CIRC} ${CIRC}`);
  const [displayPct, setDisplayPct] = useState(0);
  const prevProgress = useRef(0);

  useEffect(() => {
    const controls = animate(motionProgress, progress, { duration: 0.6, ease: "easeOut" });
    const unsub = motionProgress.on("change", (v) => setDisplayPct(Math.round(v)));
    prevProgress.current = progress;
    return () => { controls.stop(); unsub(); };
  }, [progress, motionProgress]);

  const step =
    progress === 0 ? "idle" :
    progress < 100 ? "uploading" :
    "done";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 20, padding: "32px 24px",
      }}
    >
      {/* ── Glow backdrop ── */}
      <div style={{ position: "relative", width: 144, height: 144 }}>
        {/* Outer ambient glow — pulses with progress */}
        <motion.div
          animate={{
            opacity: step === "done" ? [0.6, 0.9, 0.6] : [0.25, 0.55, 0.25],
            scale:   step === "done" ? [1, 1.08, 1] : [1, 1.04, 1],
          }}
          transition={{ duration: step === "done" ? 1.4 : 2.2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", inset: -20,
            borderRadius: "50%",
            background: step === "done"
              ? "radial-gradient(circle, rgba(34,197,94,0.28) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(0,194,255,0.22) 0%, transparent 70%)",
            filter: "blur(12px)",
            pointerEvents: "none",
          }}
        />

        {/* Orbiting dot */}
        {step === "uploading" && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
            style={{ position: "absolute", inset: -8, borderRadius: "50%" }}
          >
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{
                position: "absolute", top: "50%", left: "100%",
                width: 8, height: 8, borderRadius: "50%",
                background: "var(--accent)",
                transform: "translate(-50%, -50%)",
                boxShadow: "0 0 10px 3px rgba(0,194,255,0.7)",
              }}
            />
          </motion.div>
        )}

        {/* SVG ring */}
        <svg width="144" height="144" viewBox="0 0 144 144" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor={step === "done" ? "#22c55e" : "#00c2ff"} />
              <stop offset="100%" stopColor={step === "done" ? "#16a34a" : "#6366f1"} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Track */}
          <circle
            cx="72" cy="72" r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="6"
          />

          {/* Progress arc */}
          <motion.circle
            cx="72" cy="72" r={RADIUS}
            fill="none"
            stroke="url(#ring-grad)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={strokeDash as unknown as string}
            strokeDashoffset="0"
            transform="rotate(-90 72 72)"
            filter="url(#glow)"
          />
        </svg>

        {/* Center icon + percentage */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 4,
        }}>
          <AnimatePresence mode="wait">
            {step === "idle" && (
              <motion.div key="idle" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}>
                <Camera size={26} color="var(--text-3)" strokeWidth={1.5} />
              </motion.div>
            )}
            {step === "uploading" && (
              <motion.div key="uploading" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Upload size={22} color="var(--accent)" strokeWidth={1.5} />
                </motion.div>
              </motion.div>
            )}
            {step === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 18 }}
              >
                <CheckCircle size={28} color="var(--green)" strokeWidth={1.5} />
              </motion.div>
            )}
          </AnimatePresence>

          {step === "uploading" && (
            <motion.span
              key={displayPct}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "var(--accent)", lineHeight: 1 }}
            >
              {displayPct}%
            </motion.span>
          )}
        </div>
      </div>

      {/* Status label */}
      <AnimatePresence mode="wait">
        {step === "idle" && (
          <motion.div key="lbl-idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
            <p style={{ color: "var(--text-2)", fontSize: 14, fontWeight: 500 }}>Preparing upload…</p>
          </motion.div>
        )}
        {step === "uploading" && (
          <motion.div key="lbl-up" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center">
            <p style={{ color: "var(--text-1)", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Uploading image</p>
            <motion.p
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              style={{ color: "var(--text-3)", fontSize: 12 }}
            >
              Sending to ImgBB servers…
            </motion.p>
          </motion.div>
        )}
        {step === "done" && (
          <motion.div key="lbl-done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center">
            <p style={{ color: "var(--green)", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Upload complete</p>
            <p style={{ color: "var(--text-3)", fontSize: 12 }}>Finalising your report…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress steps */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {[
          { label: "Photo", done: progress > 0 },
          { label: "Upload", done: progress >= 90 },
          { label: "Saved",  done: done },
        ].map((s, i) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <motion.div
                animate={{ background: s.done ? "var(--accent)" : "var(--bg-4)", borderColor: s.done ? "var(--accent)" : "var(--border)" }}
                style={{
                  width: 7, height: 7, borderRadius: "50%",
                  border: "1.5px solid var(--border)",
                  transition: "all 0.4s ease",
                }}
              />
              <span style={{ fontSize: 10, color: s.done ? "var(--text-2)" : "var(--text-3)" }}>{s.label}</span>
            </div>
            {i < 2 && (
              <div style={{ width: 24, height: 1, background: s.done ? "var(--accent)" : "var(--border)", marginBottom: 12, transition: "background 0.4s ease" }} />
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
