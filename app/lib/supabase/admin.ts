import { authorizeInquiryAdministration, type InquiryAdministrationAccess } from "../../inquiries/admin-authorization";
import { createSupabaseAdminClient, createSupabaseRequestClient } from "./server";

export type AdministratorAccessResult =
  | InquiryAdministrationAccess
  | {
      allowed: false;
      status: 503;
      reason: "not_configured" | "authorization_unavailable";
    };

export async function getInquiryAdministratorAccess(): Promise<AdministratorAccessResult> {
  const requestClient = await createSupabaseRequestClient();
  const adminClient = createSupabaseAdminClient();

  if (!requestClient || !adminClient) {
    return { allowed: false, status: 503, reason: "not_configured" };
  }

  const { data: userData, error: userError } = await requestClient.auth.getUser();
  if (userError || !userData.user) {
    return authorizeInquiryAdministration(null, null);
  }

  const { data: role, error: roleError } = await adminClient
    .from("administrator_roles")
    .select("auth_user_id, role, is_active")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (roleError) {
    return { allowed: false, status: 503, reason: "authorization_unavailable" };
  }

  return authorizeInquiryAdministration(
    userData.user.id,
    role && role.role === "administrator"
      ? {
          authUserId: role.auth_user_id,
          role: "administrator",
          isActive: role.is_active,
        }
      : null,
  );
}
