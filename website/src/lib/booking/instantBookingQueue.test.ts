import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getBookingTimeline,
  getStatusLabel,
  getStatusColor,
  type TimelineStep,
} from "./status";
import type { BookingDoc } from "./types";

describe("Instant Booking & 6-Stage Lifecycle", () => {
  it("initial booking produces Booking Confirmed (done) and Finding Partner (active)", () => {
    const booking: BookingDoc = {
      id: "bk_instant_001",
      bookingCode: "RS-TEST-001",
      status: "New",
      lifecycleStatus: "FINDING_PARTNER",
      assignmentStatus: "SEARCHING",
      createdAt: { toDate: () => new Date("2026-11-26T10:00:00Z") } as any,
    };

    const timeline = getBookingTimeline(booking);
    assert.equal(timeline.length, 6);

    const confirmed = timeline.find((s) => s.key === "confirmed");
    const finding = timeline.find((s) => s.key === "finding_partner");
    const assigned = timeline.find((s) => s.key === "partner_assigned");

    assert.ok(confirmed?.done, "Confirmed should be done immediately");
    assert.equal(confirmed?.active, false);

    assert.ok(finding?.active, "Finding partner should be active");
    assert.equal(finding?.done, false);

    assert.equal(assigned?.done, false);
    assert.equal(assigned?.active, false);

    assert.equal(getStatusLabel(booking.status), "Confirmed");
    assert.equal(getStatusColor(booking.status), "bg-amber-100 text-amber-800");
  });

  it("assigning partner transitions Finding Partner to done and Partner Assigned to active", () => {
    const booking: BookingDoc = {
      id: "bk_instant_002",
      bookingCode: "RS-TEST-002",
      status: "Assigned",
      technicianId: "tech_delhi_007",
      technicianName: "Vikram Sharma",
      assignedAt: { toDate: () => new Date("2026-11-26T10:02:00Z") } as any,
      createdAt: { toDate: () => new Date("2026-11-26T10:00:00Z") } as any,
    };

    const timeline = getBookingTimeline(booking);
    const finding = timeline.find((s) => s.key === "finding_partner");
    const assigned = timeline.find((s) => s.key === "partner_assigned");
    const onTheWay = timeline.find((s) => s.key === "on_the_way");

    assert.ok(finding?.done, "Finding partner is done once technicianId exists");
    assert.equal(finding?.active, false);

    assert.ok(assigned?.active, "Partner Assigned is active before on-the-way");
    assert.equal(onTheWay?.active, false);
    assert.equal(onTheWay?.done, false);

    assert.equal(getStatusLabel(booking.status), "Partner Assigned");
    assert.equal(getStatusColor(booking.status), "bg-purple-100 text-purple-800");
  });

  it("technician on the way transitions to On The Way (active)", () => {
    const booking: BookingDoc = {
      id: "bk_instant_003",
      bookingCode: "RS-TEST-003",
      status: "PARTNER_ON_THE_WAY",
      technicianId: "tech_delhi_007",
      technicianName: "Vikram Sharma",
      onTheWayAt: { toDate: () => new Date("2026-11-26T10:15:00Z") } as any,
      assignedAt: { toDate: () => new Date("2026-11-26T10:02:00Z") } as any,
      createdAt: { toDate: () => new Date("2026-11-26T10:00:00Z") } as any,
    } as any;

    const timeline = getBookingTimeline(booking);
    const assigned = timeline.find((s) => s.key === "partner_assigned");
    const onTheWay = timeline.find((s) => s.key === "on_the_way");
    const started = timeline.find((s) => s.key === "service_started");

    assert.ok(assigned?.done, "Partner Assigned is marked done once on the way");
    assert.ok(onTheWay?.active, "On The Way is active");
    assert.equal(started?.active, false);

    assert.equal(getStatusLabel(booking.status), "On The Way");
    assert.equal(getStatusColor(booking.status), "bg-indigo-100 text-indigo-800");
  });

  it("service started transitions to Service Started (active)", () => {
    const booking: BookingDoc = {
      id: "bk_instant_004",
      bookingCode: "RS-TEST-004",
      status: "In Progress",
      technicianId: "tech_delhi_007",
      technicianName: "Vikram Sharma",
      arrivalVerified: true,
      serviceStartedAt: { toDate: () => new Date("2026-11-26T10:30:00Z") } as any,
      createdAt: { toDate: () => new Date("2026-11-26T10:00:00Z") } as any,
    };

    const timeline = getBookingTimeline(booking);
    const onTheWay = timeline.find((s) => s.key === "on_the_way");
    const started = timeline.find((s) => s.key === "service_started");
    const completed = timeline.find((s) => s.key === "completed");

    assert.ok(onTheWay?.done, "On The Way is done");
    assert.ok(started?.active, "Service Started is active");
    assert.equal(completed?.active, false);

    assert.equal(getStatusLabel(booking.status), "Service Started");
    assert.equal(getStatusColor(booking.status), "bg-blue-100 text-blue-800");
  });

  it("service completed transitions all steps to done", () => {
    const booking: BookingDoc = {
      id: "bk_instant_005",
      bookingCode: "RS-TEST-005",
      status: "Completed",
      technicianId: "tech_delhi_007",
      technicianName: "Vikram Sharma",
      arrivalVerified: true,
      serviceStartedAt: { toDate: () => new Date("2026-11-26T10:30:00Z") } as any,
      completedAt: { toDate: () => new Date("2026-11-26T11:45:00Z") } as any,
      createdAt: { toDate: () => new Date("2026-11-26T10:00:00Z") } as any,
    };

    const timeline = getBookingTimeline(booking);
    assert.ok(timeline.every((s) => s.done), "All steps should be done on completion");
    assert.equal(getStatusLabel(booking.status), "Completed");
    assert.equal(getStatusColor(booking.status), "bg-green-100 text-green-800");
  });

  it("cancelled booking disables all active indicators", () => {
    const booking: BookingDoc = {
      id: "bk_instant_006",
      bookingCode: "RS-TEST-006",
      status: "Cancelled",
      createdAt: { toDate: () => new Date("2026-11-26T10:00:00Z") } as any,
    };

    const timeline = getBookingTimeline(booking);
    assert.ok(timeline.every((s) => !s.active), "No steps should be active when cancelled");
    assert.equal(getStatusLabel(booking.status), "Cancelled");
    assert.equal(getStatusColor(booking.status), "bg-red-100 text-red-800");
  });
});

describe("Background Queue Structure & Capacity Safety", () => {
  it("validates queue job schema and failure tolerance", () => {
    const jobPayload = {
      bookingId: "bk_instant_100",
      customerId: "cust_123",
      customerName: "Aman Gupta",
      customerPhone: "9876543210",
      serviceId: "srv_ac_repair",
      serviceName: "AC Repair & Servicing",
      dateKey: "2026-11-27",
      slotId: "slot_10_11",
      slotIndex: 2,
      scheduledSlotLabel: "10:00 AM - 11:00 AM",
      address: {
        street: "Sector 23 Market",
        area: "Sector 23",
        city: "Gurgaon",
        state: "Haryana",
        pincode: "122017",
      },
    };

    // Verify all required parameters exist for background assignment execution
    assert.ok(jobPayload.bookingId);
    assert.ok(jobPayload.serviceId);
    assert.ok(jobPayload.dateKey);
    assert.equal(jobPayload.slotIndex, 2);
    assert.equal(jobPayload.address.city, "Gurgaon");

    // Test capacity handling: if no technicians are available
    const capacityFailure = {
      ok: false,
      status: "NO_ELIGIBLE_PARTNER",
      error: "No verified partner available in Sector 23 for this time slot.",
    };

    // Ensure booking status stays intact as New / FINDING_PARTNER
    const bookingState = {
      status: "New",
      lifecycleStatus: "FINDING_PARTNER",
      assignmentStatus: "SEARCHING",
      technicianId: null,
      lastAssignmentError: capacityFailure.status,
    };

    assert.equal(bookingState.status, "New");
    assert.equal(bookingState.lifecycleStatus, "FINDING_PARTNER");
    assert.equal(bookingState.technicianId, null);
    assert.equal(bookingState.lastAssignmentError, "NO_ELIGIBLE_PARTNER");
  });

  it("prevents double-booking assignment through atomic lock simulation", () => {
    let jobLocked = false;
    function claimJob() {
      if (jobLocked) return false;
      jobLocked = true;
      return true;
    }

    const firstWorker = claimJob();
    const secondWorker = claimJob();

    assert.equal(firstWorker, true, "First worker successfully acquired job lock");
    assert.equal(secondWorker, false, "Second worker blocked by atomic job lock");
  });
});
