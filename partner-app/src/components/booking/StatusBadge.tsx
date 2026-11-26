import React from "react";
import { Badge } from "../common/Badge";
import { BookingStatus, BookingLifecycleStatus, AssignmentStatus } from "../../types/booking";

interface StatusBadgeProps {
  status: BookingStatus | string;
  lifecycleStatus?: BookingLifecycleStatus | string;
  assignmentStatus?: AssignmentStatus | string;
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  lifecycleStatus,
  assignmentStatus,
  size = "md",
}) => {
  const getBadgeConfig = (): {
    label: string;
    tone: "primary" | "success" | "warning" | "danger" | "info" | "neutral";
    dot: boolean;
  } => {
    const assignSt = String(assignmentStatus || "").toUpperCase();
    const lifeSt = String(lifecycleStatus || "").toUpperCase();
    const st = String(status || "").toLowerCase();

    if (assignSt === "OFFERED" || assignSt === "SEARCHING") {
      return { label: "New Request", tone: "warning", dot: true };
    }

    if (st === "completed" || lifeSt === "COMPLETED") {
      return { label: "Completed", tone: "success", dot: false };
    }

    if (st === "cancelled" || lifeSt === "CANCELLED") {
      return { label: "Cancelled", tone: "danger", dot: false };
    }

    switch (lifeSt) {
      case "PARTNER_ON_THE_WAY":
        return { label: "On The Way", tone: "info", dot: true };
      case "PARTNER_ARRIVED":
        return { label: "Reached Location", tone: "info", dot: true };
      case "JOB_STARTED":
      case "WORK_IN_PROGRESS":
        return { label: "In Progress", tone: "primary", dot: true };
      case "WORK_COMPLETED":
        return { label: "Work Done · Payment Pending", tone: "warning", dot: true };
      case "PARTNER_ACCEPTED":
      default:
        return { label: "Accepted", tone: "primary", dot: true };
    }
  };

  const config = getBadgeConfig();

  return (
    <Badge
      label={config.label}
      tone={config.tone}
      size={size}
      dot={config.dot}
    />
  );
};
