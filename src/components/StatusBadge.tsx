"use client";
import { Clock, Search, CheckCircle } from "lucide-react";

type Status = "pending" | "reviewed" | "resolved";

interface StatusBadgeProps {
  status: Status;
}

const config: Record<Status, { label: string; Icon: typeof Clock; cls: string }> = {
  pending:  { label: "Pending",  Icon: Clock,        cls: "badge-pending"  },
  reviewed: { label: "Reviewed", Icon: Search,       cls: "badge-reviewed" },
  resolved: { label: "Resolved", Icon: CheckCircle,  cls: "badge-resolved" },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { label, Icon, cls } = config[status] ?? config.pending;
  return (
    <span className={`badge ${cls}`}>
      <Icon size={11} strokeWidth={2.5} />
      {label}
    </span>
  );
}
