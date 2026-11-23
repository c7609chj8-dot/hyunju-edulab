import { NextResponse } from "next/server";
import { createAuthClient } from "../server";
import { authConfigured, authSiteUrl } from "../config";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  if (code && code.length <= 4096 && authConfigured()) {
    try {
      const client = await createAuthClient();
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(`${authSiteUrl()}/account`);
    } catch { /* Do not echo codes or provider details. */ }
  }
  return NextResponse.redirect(`${authSiteUrl()}/login?error=confirmation`);
}
