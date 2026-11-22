import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "../../lib/supabase/server";
import { getInquiryAdministratorAccess } from "../../lib/supabase/admin";
import { isInquiryStatus } from "../../inquiries/workflow";
import AdminInquiryList, { type AdministratorInquiry } from "./admin-inquiry-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "문의 관리 | 현주에듀랩",
  robots: { index: false, follow: false },
};

function toAdministratorInquiry(value: unknown): AdministratorInquiry | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const requiredText = ["id", "inquiry_number", "category", "sender_name", "sender_contact", "message", "created_at"];
  if (requiredText.some((key) => typeof record[key] !== "string")) return null;
  if (!isInquiryStatus(record.status) || typeof record.revision !== "number") return null;
  if (record.program_slug !== null && typeof record.program_slug !== "string") return null;
  if (record.sender_email !== null && typeof record.sender_email !== "string") return null;

  return {
    id: record.id as string,
    inquiryNumber: record.inquiry_number as string,
    category: record.category as string,
    programSlug: record.program_slug as string | null,
    senderName: record.sender_name as string,
    senderContact: record.sender_contact as string,
    senderEmail: record.sender_email as string | null,
    message: record.message as string,
    status: record.status,
    revision: record.revision,
    createdAt: record.created_at as string,
  };
}

export default async function AdministratorInquiriesPage() {
  const access = await getInquiryAdministratorAccess();
  if (!access.allowed) {
    if (access.reason === "unauthenticated") redirect("/admin/login?next=/admin/inquiries");

    return (
      <section className="shell section content-page admin-page">
        <p className="eyebrow">ADMIN</p>
        <h1>문의 관리</h1>
        <p className="contact-preview">
          {access.reason === "not_configured"
            ? "테스트용 Supabase 관리자 설정이 아직 완료되지 않았습니다."
            : access.reason === "authorization_unavailable"
              ? "관리자 권한을 확인할 수 없습니다. 잠시 후 다시 시도해 주세요."
              : "이 계정에는 문의 관리 권한이 없습니다."}
        </p>
      </section>
    );
  }

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    return (
      <section className="shell section content-page admin-page">
        <p className="eyebrow">ADMIN</p>
        <h1>문의 관리</h1>
        <p className="contact-preview">테스트용 Supabase 관리자 설정이 아직 완료되지 않았습니다.</p>
      </section>
    );
  }

  const { data, error } = await adminClient
    .from("inquiries")
    .select("id, inquiry_number, category, program_slug, sender_name, sender_contact, sender_email, message, status, revision, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return (
      <section className="shell section content-page admin-page">
        <p className="eyebrow">ADMIN</p>
        <h1>문의 관리</h1>
        <p className="contact-preview">문의 목록을 불러올 수 없습니다. 테스트 DB 설정을 확인해 주세요.</p>
      </section>
    );
  }

  const inquiries = (Array.isArray(data) ? data : [])
    .map(toAdministratorInquiry)
    .filter((inquiry): inquiry is AdministratorInquiry => inquiry !== null);

  return (
    <section className="shell section content-page admin-page">
      <p className="eyebrow">ADMIN</p>
      <h1>문의 관리</h1>
      <AdminInquiryList inquiries={inquiries} />
    </section>
  );
}
