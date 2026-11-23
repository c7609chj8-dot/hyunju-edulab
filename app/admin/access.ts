import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { authConfigured } from "../auth/config";
import { createAuthClient } from "../auth/server";

export const administrationAccess = cache(async () => {
  if (!authConfigured()) return { kind: "unavailable" as const };
  const client = await createAuthClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error && error.status && error.status >= 500) return { kind: "unavailable" as const };
  if (!user || error || !user.email_confirmed_at || user.is_anonymous) redirect("/admin/login");
  const [role, profile] = await Promise.all([
    client.from("member_administrators").select("user_id").eq("user_id", user.id).eq("is_active", true).maybeSingle(),
    client.from("member_profiles").select("account_status").eq("user_id", user.id).maybeSingle(),
  ]);
  if (role.error || profile.error) return { kind: "unavailable" as const };
  if (!role.data || profile.data?.account_status !== "active") return { kind: "forbidden" as const };
  return { kind: "allowed" as const, client, user };
});
