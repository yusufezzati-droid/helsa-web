import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { OAUTH_STATE_COOKIE, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { upsertOAuthCustomer } from "@/lib/auth-service";
import { isAdminEmail } from "@/lib/admin";
import { makeClientSecret } from "../client-secret";
import { resolveOrigin, safeNextPath } from "@/lib/security";

const appleJWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

export async function POST(req: Request) {
  const origin = resolveOrigin(req);
  const form = await req.formData();
  const idToken = String(form.get("id_token") ?? "");
  const state = String(form.get("state") ?? "");
  const next = safeNextPath(String(form.get("next") ?? ""), "/account");
  const store = await cookies();
  const expected = store.get(OAUTH_STATE_COOKIE)?.value;

  if (!idToken || !state || !expected || state !== expected) {
    return NextResponse.redirect(`${origin}/login?social=error`);
  }
  store.delete(OAUTH_STATE_COOKIE);

  try {
    const { payload } = await jwtVerify(idToken, appleJWKS, {
      issuer: "https://appleid.apple.com",
      audience: process.env.APPLE_CLIENT_ID,
    });
    const email = typeof payload.email === "string" ? payload.email : "";
    if (!email) return NextResponse.redirect(`${origin}/login?social=error`);
    if (process.env.APPLE_PRIVATE_KEY) await makeClientSecret(process.env.APPLE_CLIENT_ID!).catch(() => null);

    const { token: session } = await upsertOAuthCustomer({ name: email.split("@")[0], email, provider: "apple" });
    const destination = isAdminEmail(email) ? "/admin" : next;
    const res = NextResponse.redirect(`${origin}${destination}`);
    res.cookies.set(SESSION_COOKIE, session, sessionCookieOptions());
    return res;
  } catch {
    return NextResponse.redirect(`${origin}/login?social=error`);
  }
}
