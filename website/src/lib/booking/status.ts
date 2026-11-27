import type { BookingDoc } from "@/lib/booking/types";

export const DASHBOARD_TABS = [
  {
    key: "upcoming",
    label: "Upcoming",
    statuses: ["new", "pending", "upcoming"],
  },
  {
    key: "accepted",
    label: "Accepted",
    statuses: ["accepted"],
  },
  {
    key: "assigned",
    label: "Technician Assigned",
    statuses: ["assigned"],
  },
  {
    key: "in_progress",
    label: "In Progress",
    statuses: ["inprogress", "started", "processing"],
  },
  {
    key: "completed",
    label: "Completed",
    statuses: ["completed"],
  },
  {
    key: "cancelled",
    label: "Cancelled",
    statuses: ["cancelled", "canceled"],
  },
] as const;

export type DashboardTabKey = (typeof DASHBOARD_TABS)[number]["key"];

export function normalizeStatus(status: unknown): string {
  return String(status ?? "pending")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "");
}

export function getStatusLabel(status: unknown): string {
  const s = normalizeStatus(status);
  if (s === "new" || s === "pending" || s === "upcoming") return "Confirmed";
  if (s === "assigned") return "Partner Assigned";
  if (s === "partnerontheway" || s === "onway") return "On The Way";
  if (s === "inprogress" || s === "started") return "Service Started";
  if (s === "completed") return "Completed";
  if (s === "cancelled" || s === "canceled") return "Cancelled";
  return String(status ?? "Confirmed");
}

export function getStatusColor(status: unknown): string {
  const s = normalizeStatus(status);
  if (s === "completed") return "bg-green-100 text-green-800";
  if (s === "cancelled" || s === "canceled") return "bg-red-100 text-red-800";
  if (s === "inprogress" || s === "started") return "bg-blue-100 text-blue-800";
  if (s === "assigned") return "bg-purple-100 text-purple-800";
  if (s === "partnerontheway" || s === "onway") return "bg-indigo-100 text-indigo-800";
  return "bg-amber-100 text-amber-800";
}

export type TimelineStep = {
  key: string;
  label: string;
  done: boolean;
  active: boolean;
  at?: Date | null;
};

export function getBookingTimeline(booking: BookingDoc): TimelineStep[] {
  const status = normalizeStatus(booking.status);
  const created = booking.createdAt?.toDate?.() ?? null;
  const assigned =
    booking.assignedAt?.toDate?.() ??
    (booking.technicianId ? created : null);
  const onTheWay =
    (booking as { onTheWayAt?: { toDate?: () => Date } }).onTheWayAt?.toDate?.() ??
    booking.arrivalVerifiedAt?.toDate?.() ??
    null;
  const started = booking.serviceStartedAt?.toDate?.() ?? null;
  const completed = booking.completedAt?.toDate?.() ?? null;

  const hasTech = Boolean(booking.technicianId);
  const isOnTheWay =
    status === "partnerontheway" ||
    status === "onway" ||
    Boolean((booking as { onTheWayAt?: unknown }).onTheWayAt);
  const hasArrived = Boolean(booking.arrivalVerified);
  const isStarted = status === "inprogress" || status === "started" || Boolean(booking.serviceStartedAt);
  const isCompleted = status === "completed" || Boolean(booking.completedAt);
  const isCancelled = status === "cancelled" || status === "canceled";

  const steps: TimelineStep[] = [
    {
      key: "confirmed",
      label: "Booking Confirmed",
      done: Boolean(created),
      active: false,
      at: created,
    },
    {
      key: "finding_partner",
      label: "Finding Partner",
      done: hasTech && !isCancelled,
      active: !hasTech && !isCancelled,
      at: created,
    },
    {
      key: "partner_assigned",
      label: "Partner Assigned",
      done: hasTech && (isOnTheWay || hasArrived || isStarted || isCompleted) && !isCancelled,
      active: hasTech && !isOnTheWay && !hasArrived && !isStarted && !isCompleted && !isCancelled,
      at: assigned,
    },
    {
      key: "on_the_way",
      label: "Partner On The Way",
      done: (hasArrived || isStarted || isCompleted) && !isCancelled,
      active: (isOnTheWay || hasArrived) && !isStarted && !isCompleted && !isCancelled,
      at: onTheWay,
    },
    {
      key: "service_started",
      label: "Service Started",
      done: isCompleted && !isCancelled,
      active: isStarted && !isCompleted && !isCancelled,
      at: started,
    },
    {
      key: "completed",
      label: "Service Completed",
      done: isCompleted && !isCancelled,
      active: isCompleted && !isCancelled,
      at: completed,
    },
  ];

  if (isCancelled) {
    return steps.map((s) => ({ ...s, active: false }));
  }
  return steps;
}
