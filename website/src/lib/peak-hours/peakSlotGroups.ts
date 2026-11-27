export interface ScheduleSlotDef {
  index: number;
  startHour: number;
  endHour: number;
  label: string;
}

export const SCHEDULE_SLOT_DEFS: ScheduleSlotDef[] = [
  { index: 0, startHour: 8, endHour: 9, label: "08:00 AM - 09:00 AM" },
  { index: 1, startHour: 9, endHour: 10, label: "09:00 AM - 10:00 AM" },
  { index: 2, startHour: 10, endHour: 11, label: "10:00 AM - 11:00 AM" },
  { index: 3, startHour: 11, endHour: 12, label: "11:00 AM - 12:00 PM" },
  { index: 4, startHour: 12, endHour: 13, label: "12:00 PM - 01:00 PM" },
  { index: 5, startHour: 13, endHour: 14, label: "01:00 PM - 02:00 PM" },
  { index: 6, startHour: 14, endHour: 15, label: "02:00 PM - 03:00 PM" },
  { index: 7, startHour: 15, endHour: 16, label: "03:00 PM - 04:00 PM" },
  { index: 8, startHour: 16, endHour: 17, label: "04:00 PM - 05:00 PM" },
  { index: 9, startHour: 17, endHour: 18, label: "05:00 PM - 06:00 PM" },
  { index: 10, startHour: 18, endHour: 19, label: "06:00 PM - 07:00 PM" },
  { index: 11, startHour: 19, endHour: 20, label: "07:00 PM - 08:00 PM" },
];

export interface PeakWindowDef {
  startHour: number;
  endHour: number;
  label?: string;
  enabled?: boolean;
}

export interface SlotGroup {
  type: "peak" | "single";
  slotIndexes: number[];
  label: string;
}

export function groupSlotsByPeakWindows(options: {
  peakWindows?: PeakWindowDef[];
  slotDefs?: ScheduleSlotDef[];
}): SlotGroup[] {
  const slotDefs = options.slotDefs || SCHEDULE_SLOT_DEFS;
  const activeWindows = (options.peakWindows || []).filter(
    (w) => w.enabled !== false && Math.floor(w.endHour) - Math.floor(w.startHour) >= 1 && (w.endHour % 1 === 0) && (w.startHour % 1 === 0)
  );

  const groups: SlotGroup[] = [];
  const processedIndexes = new Set<number>();

  for (const window of activeWindows) {
    const matchingSlots = slotDefs.filter(
      (s) => s.startHour >= window.startHour && s.endHour <= window.endHour
    );
    if (matchingSlots.length >= 1) {
      const slotIndexes = matchingSlots.map((s) => s.index);
      slotIndexes.forEach((idx) => processedIndexes.add(idx));
      const startSlot = matchingSlots[0];
      const endSlot = matchingSlots[matchingSlots.length - 1];
      const rangeLabel = `${startSlot.startHour}:00–${endSlot.endHour}:00`;
      const label = window.label ? `${rangeLabel} (${window.label})` : rangeLabel;
      groups.push({
        type: "peak",
        slotIndexes,
        label,
      });
    }
  }

  for (const slot of slotDefs) {
    if (!processedIndexes.has(slot.index)) {
      groups.push({
        type: "single",
        slotIndexes: [slot.index],
        label: slot.label,
      });
    }
  }

  groups.sort((a, b) => a.slotIndexes[0] - b.slotIndexes[0]);
  return groups;
}

export function flattenGroupSlotIndexes(groups: SlotGroup[]): number[] {
  return groups.flatMap((g) => g.slotIndexes);
}
