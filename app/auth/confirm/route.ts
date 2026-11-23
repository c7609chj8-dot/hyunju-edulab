import { NextResponse } from "next/server";
import { createAuthClient } from "../server";
import { authConfigured, authSiteUrl } from "../config";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  if (tokenHash && tokenHash.length <= 4096 && (type === "email" || type === "signup") && authConfigured()) {
    try {
      const client = await createAuthClient();
      const { error } = await client.auth.verifyOtp({ token_hash: tokenHash, type });
      if (!error) return NextResponse.redirect(`${authSiteUrl()}/account`);
    } catch { /* Do not echo tokens or provider details. */ }
  }
  return NextResponse.redirect(`${authSiteUrl()}/login?error=confirmation`);
}
