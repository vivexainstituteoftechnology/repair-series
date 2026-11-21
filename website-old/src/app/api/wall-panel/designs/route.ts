import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { apiOptions, jsonWithCors, publicErrorMessage } from "@/lib/server/http";

export const runtime = "nodejs";

export function OPTIONS(req: NextRequest) {
  return apiOptions(req);
}

/** Public active wall panel designs for customer browse. */
export async function GET(req: NextRequest) {
  try {
    const db = getAdminDb();
    const snap = await db
      .collection("wallPanelDesigns")
      .where("active", "==", true)
      .limit(100)
      .get();
    const designs = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }))
      .sort((a, b) => Number((a as { sortOrder?: number }).sortOrder ?? 0) - Number((b as { sortOrder?: number }).sortOrder ?? 0));
    return jsonWithCors(req, { ok: true, designs });
  } catch (err) {
    const status = Number((err as { status?: number })?.status) || 500;
    return jsonWithCors(req, { error: publicErrorMessage(err, "Could not load designs") }, { status });
  }
}
