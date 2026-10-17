import { NextResponse } from "next/server";
import { checkDatabase, isDatabaseConfigured } from "@/db";
import { onlineGatewayEnabled } from "@/config/payments";
import { authSecretRaw } from "@/lib/secrets";

/** GET /api/health — liveness + configuration report (developer facing) */
export async function GET() {
  const database = await checkDatabase();
  return NextResponse.json({
    ok: true,
    status: "healthy",
    checks: {
      database: { configured: isDatabaseConfigured, ...database },
      auth: {
        sessionSecret: Boolean(authSecretRaw()),
        google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        apple: Boolean(process.env.APPLE_CLIENT_ID && process.env.APPLE_PRIVATE_KEY),
      },
      payment: { onlineGateway: onlineGatewayEnabled() },
    },
  });
}
