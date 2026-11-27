import { NextRequest } from "next/server";
import { jsonWithCors } from "@/lib/api/cors";
import { adminCredentialFailure, requireApiCaller } from "@/lib/server/auth";
import { publicErrorMessage } from "@/lib/server/http";
import { processPartnerAssignmentQueue } from "@/lib/server/assignment/assignmentQueue";
import {
  classifyFirebaseAdminErrorCode,
  clientMessageForAdminFailure,
  logSafeFirebaseAdminFailure,
} from "@/lib/firebase/adminErrors";

export async function handleProcessQueuePost(req: NextRequest) {
  try {
    const caller = await requireApiCaller(req);
    // Allow customer (for their own booking queue trigger), admin, or internal cron/system callers
    const body = (await req.json().catch(() => ({}))) as {
      bookingId?: string;
      limit?: number;
    };

    const bookingId = body.bookingId ? String(body.bookingId).trim() : undefined;
    const limit = typeof body.limit === "number" ? Math.min(25, Math.max(1, body.limit)) : 10;

    const result = await processPartnerAssignmentQueue({
      bookingId,
      limit,
    });

    return jsonWithCors(req, {
      success: true,
      ...result,
    });
  } catch (err) {
    const serverCreds = adminCredentialFailure(err);
    const status = serverCreds ? 503 : Number((err as { status?: number })?.status) || 500;
    if (serverCreds) {
      logSafeFirebaseAdminFailure(err, "api/bookings/process-queue");
    }

    const code = serverCreds
      ? classifyFirebaseAdminErrorCode(err)
      : String((err as { code?: string }).code || "").trim() || undefined;

    const error = serverCreds
      ? clientMessageForAdminFailure(err)
      : publicErrorMessage(err, "Could not process assignment queue");

    return jsonWithCors(
      req,
      {
        success: false,
        error,
        code,
      },
      { status },
    );
  }
}
