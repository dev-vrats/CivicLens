"use client";
import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export default function LoadingSpinner({ message, size = "md" }: LoadingSpinnerProps) {
  const dim = size === "sm" ? 16 : size === "md" ? 28 : 40;
  const stroke = size === "sm" ? 2 : 2.5;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={dim}
        height={dim}
        viewBox={`0 0 ${dim} ${dim}`}
        className="animate-spin"
        style={{ flexShrink: 0 }}
      >
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={dim / 2 - stroke - 1}
          fill="none"
          stroke="var(--bg-4)"
          strokeWidth={stroke}
        />
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={dim / 2 - stroke - 1}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${Math.PI * (dim - (stroke + 1) * 2) * 0.6} ${Math.PI * (dim - (stroke + 1) * 2) * 0.4}`}
        />
      </svg>
      {message && (
        <motion.p
          animate={{ opacity: [0.4, 0.85, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ color: "var(--text-3)", fontSize: 13 }}
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}
