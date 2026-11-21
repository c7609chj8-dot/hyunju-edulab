export const administratorRoleValues = ["administrator", "manager"] as const;

export type AdministratorRole = (typeof administratorRoleValues)[number];

export type AdministratorRoleRecord = {
  authUserId: string;
  role: AdministratorRole;
  isActive: boolean;
};

export type InquiryAdministrationAccess =
  | { allowed: true; authUserId: string; role: "administrator" }
  | { allowed: false; status: 401 | 403; reason: "unauthenticated" | "forbidden" };

export function authorizeInquiryAdministration(
  authenticatedUserId: string | null | undefined,
  administratorRole: AdministratorRoleRecord | null | undefined,
): InquiryAdministrationAccess {
  const authUserId = authenticatedUserId?.trim() ?? "";
  if (!authUserId) {
    return { allowed: false, status: 401, reason: "unauthenticated" };
  }

  if (
    !administratorRole
    || administratorRole.authUserId !== authUserId
    || !administratorRole.isActive
    || administratorRole.role !== "administrator"
  ) {
    return { allowed: false, status: 403, reason: "forbidden" };
  }

  return { allowed: true, authUserId, role: "administrator" };
}
