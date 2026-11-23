import "server-only";
import { redirect } from "next/navigation";
import { authConfigured } from "./config";
import { createAuthClient } from "./server";

export async function requireMember() {
  if (!authConfigured()) redirect("/login");
  const client = await createAuthClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user || !user.email_confirmed_at || user.is_anonymous) redirect("/login");
  return { client, user };
}
export async function memberAdministrator() {
  const { client, user } = await requireMember();
  const { data, error } = await client.from("member_administrators").select("user_id").eq("user_id", user.id).eq("is_active", true).maybeSingle();
  return { client, user, isAdministrator: !error && Boolean(data) };
}
