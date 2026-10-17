import { NextResponse } from "next/server";
import { requireAdminApi, adminErrorResponse } from "@/lib/admin";
import { listBusinesses } from "@/services/wholesale";

export async function GET(req: Request) {
  try {
    await requireAdminApi();
    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? undefined;
    const businesses = await listBusinesses(status ?? undefined);
    return NextResponse.json({ ok: true, businesses });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
