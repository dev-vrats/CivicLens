"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  accent?: boolean;
  onClick?: () => void;
  animate?: boolean;
}

export default function GlassCard({
  children,
  className = "",
  hoverable = false,
  accent = false,
  onClick,
  animate = true,
}: CardProps) {
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 12 } : false}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={onClick}
      className={`card ${hoverable ? "card-hover" : ""} ${className}`}
      style={accent ? { borderColor: "rgba(0,194,255,0.25)" } : {}}
    >
      {children}
    </motion.div>
  );
}
