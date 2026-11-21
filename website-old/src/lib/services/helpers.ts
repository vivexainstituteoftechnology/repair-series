import type { Firestore } from "firebase/firestore";
import type { ServiceDoc } from "@/lib/booking/types";
import { resolveServiceByPath } from "@/lib/catalog/resolve";

export function getServiceName(s: ServiceDoc) {
  return s.name ?? s.title ?? "Service";
}

export function getServiceImage(s: ServiceDoc) {
  return s.imageUrl ?? s.image ?? null;
}

export {
  getServicePrice,
  getActiveVariations,
  getServicePriceDisplay,
  getSelectedVariationPrice,
  serviceHasVariations,
  normalizeVariation,
} from "@/lib/services/pricing";

export function getVisitingCharge(_s: ServiceDoc): number {
  return 0;
}

export function mergeVariationsList(
  embeddedList: unknown,
  collectionList: unknown,
): ServiceDoc["variations"] {
  const embedded = Array.isArray(embeddedList) ? embeddedList : [];
  const fromCol = Array.isArray(collectionList) ? collectionList : [];
  const map = new Map<string, Record<string, unknown>>();

  for (let i = 0; i < embedded.length; i++) {
    const v = embedded[i];
    if (!v || typeof v !== "object") continue;
    const rec = v as Record<string, unknown>;
    const id = String(rec.id ?? rec.variationId ?? "").trim();
    const title = String(rec.title ?? rec.name ?? "").trim();
    const key = id || title || `idx-${i}`;
    map.set(key, { ...rec, id: id || key });
  }

  for (const v of fromCol) {
    if (!v || typeof v !== "object") continue;
    const rec = v as Record<string, unknown>;
    const id = String(rec.id ?? rec.variationId ?? "").trim();
    const title = String(rec.title ?? rec.name ?? "").trim();

    let targetKey: string | null = null;
    if (id && map.has(id)) {
      targetKey = id;
    } else if (title) {
      for (const [k, existing] of map.entries()) {
        const exTitle = String(existing?.title ?? existing?.name ?? "").trim();
        if (exTitle && exTitle.toLowerCase() === title.toLowerCase()) {
          targetKey = k;
          break;
        }
      }
    }

    if (targetKey) {
      const existing = map.get(targetKey)!;
      map.set(targetKey, { ...existing, ...rec, id: id || (existing.id as string) });
    } else {
      const key = id || title || `col-${map.size}`;
      map.set(key, { ...rec, id: id || key });
    }
  }

  const items = Array.from(map.values());
  items.sort((a, b) => {
    const oa = Number(a.displayOrder ?? a.order ?? 0);
    const ob = Number(b.displayOrder ?? b.order ?? 0);
    if (oa !== ob) return oa - ob;
    const ta = String(a.title ?? a.name ?? "");
    const tb = String(b.title ?? b.name ?? "");
    return ta.localeCompare(tb);
  });
  return items as unknown as ServiceDoc["variations"];
}

export async function loadService(
  db: Firestore,
  serviceIdOrSlug: string,
): Promise<ServiceDoc | null> {
  const row = await resolveServiceByPath(db, serviceIdOrSlug);
  if (!row) return null;
  const service = row as ServiceDoc;
  try {
    const { collection, getDocs, query, where } = await import("firebase/firestore");
    const sId = String(service.id || "").trim();
    const snap = await getDocs(query(collection(db, "variations"), where("serviceId", "==", sId)));
    const fromCol = !snap.empty ? snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) : [];

    let extraCol: Array<Record<string, unknown>> = [];
    if (service.slug && service.slug !== sId) {
      const slugSnap = await getDocs(query(collection(db, "variations"), where("serviceId", "==", service.slug)));
      if (!slugSnap.empty) {
        extraCol = slugSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }));
      }
    }

    const merged = mergeVariationsList(service.variations, [...fromCol, ...extraCol]);
    service.variations = merged;
    if (Array.isArray(merged) && merged.length > 0) {
      service.hasVariations = true;
    }
  } catch {
    /* keep embedded */
    if (Array.isArray(service.variations) && service.variations.length > 0) {
      service.hasVariations = true;
    }
  }
  return service;
}
