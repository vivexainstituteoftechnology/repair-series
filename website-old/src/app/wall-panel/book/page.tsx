"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Container } from "@/components/container";
import { useAuth } from "@/hooks/use-auth";
import { getAuthClient } from "@/lib/firebase/auth";

const SLOTS = ["9:00 AM – 11:00 AM", "11:00 AM – 1:00 PM", "2:00 PM – 4:00 PM", "4:00 PM – 6:00 PM"];

function WallPanelBookContent() {
  const { user } = useAuth();
  const router = useRouter();
  const designId = String(useSearchParams().get("design") || "").trim();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    line1: "",
    city: "",
    pincode: "",
    date: "",
    slot: SLOTS[0],
    notes: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const auth = getAuthClient();
    const token = await auth?.currentUser?.getIdToken();
    if (!token) {
      router.push("/auth?return=/wall-panel/book");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/wall-panel/bookings/create", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          address: { line1: form.line1, city: form.city, pincode: form.pincode },
          scheduledDate: form.date,
          scheduledSlotLabel: form.slot,
          customerNotes: form.notes,
          customerName: user?.displayName || "",
          interestedDesignIds: designId ? [designId] : [],
        }),
      });
      const json = (await res.json()) as { bookingId?: string; error?: string };
      if (!res.ok) {
        setError(json.error || "Booking failed");
        return;
      }
      router.push(`/wall-panel?booked=${encodeURIComponent(json.bookingId || "")}`);
    } catch {
      setError("Network error. Please retry.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="max-w-lg py-12">
      <Link href="/wall-panel" className="text-sm font-semibold text-[#C45508]">
        ← Back to catalogue
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Book Wall Panel Consultation</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Our specialist visits with catalog samples, takes measurements, and quotes onsite.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <input
          required
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Address (House, Street, Area)"
          value={form.line1}
          onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            required
            className="rounded-lg border px-3 py-2"
            placeholder="City"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
          <input
            required
            className="rounded-lg border px-3 py-2"
            placeholder="PIN Code"
            value={form.pincode}
            onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
          />
        </div>
        <input
          required
          type="date"
          className="w-full rounded-lg border px-3 py-2"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
        />
        <select
          className="w-full rounded-lg border px-3 py-2"
          value={form.slot}
          onChange={(e) => setForm((f) => ({ ...f, slot: e.target.value }))}
        >
          {SLOTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <textarea
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-[#C45508] py-3 font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Submitting…" : "Submit request"}
        </button>
      </form>
    </Container>
  );
}

export default function WallPanelBookPage() {
  return (
    <Suspense
      fallback={
        <Container className="max-w-lg py-12">
          <div className="h-64 animate-pulse rounded-2xl bg-neutral-100" />
        </Container>
      }
    >
      <WallPanelBookContent />
    </Suspense>
  );
}
