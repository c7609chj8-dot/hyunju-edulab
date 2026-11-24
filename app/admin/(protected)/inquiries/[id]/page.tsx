import Link from "next/link";
import { notFound } from "next/navigation";
import { administrationAccess } from "../../../access";
import AdminAccessNotice from "../../../access-notice";
import { validMemberId } from "../../../validation";
import {
  inquiryDate, inquiryListQuery, inquiryListSelection, inquiryStatusLabel,
  inquiryTypeLabel, type InquiryListParams,
} from "../../../inquiries/view";
import { programs } from "../../../../programs";
import styles from "../../../admin.module.css";
import InquiryStatusEditor from "../../../inquiries/status-editor";
import { inquiryStatusValues, validateInquiryStatusTransition } from "../../../../inquiries/workflow";

export const metadata = { title: "문의 상세 | 현주에듀랩" };

export default async function InquiryDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<InquiryListParams>;
}) {
  const access = await administrationAccess();
  if (access.kind !== "allowed") return <AdminAccessNotice reason={access.kind} />;

  const { id } = await params;
  if (!validMemberId(id)) notFound();

  const { status, page } = inquiryListSelection(await searchParams);
  const backHref = "/admin/inquiries" + inquiryListQuery(status, page);
  const { data: inquiry, error } = await access.client.from("inquiries")
    .select("inquiry_number,inquiry_type,program_slug,sender_name,sender_email,message,status,revision,created_at,privacy_policy_version,privacy_consented_at")
    .eq("id", id)
    .maybeSingle();

  if (error) return (
    <section className="section content-page">
      <h1>문의 상세</h1>
      <p role="alert">문의 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      <Link href={backHref}>문의 목록으로 돌아가기</Link>
    </section>
  );
  if (!inquiry) notFound();

  const nextStatuses = inquiryStatusValues.filter((status) =>
    validateInquiryStatusTransition(inquiry.status, status).valid,
  );
  const { data: history, error: historyError } = await access.client.from("inquiry_events")
    .select("id,actor_user_id,previous_status,next_status,created_at")
    .eq("inquiry_id", id)
    .eq("event_type", "status_changed")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(20);

  const program = programs.find(({ slug }) => slug === inquiry.program_slug);
  return (
    <section className={`section content-page ${styles.detail}`}>
      <h1>문의 상세</h1>
      <dl>
        <dt>접수번호</dt><dd>{inquiry.inquiry_number}</dd>
        <dt>처리 상태</dt><dd>{inquiryStatusLabel(inquiry.status)}</dd>
        <dt>접수 시각</dt><dd>{inquiryDate(inquiry.created_at)}</dd>
        <dt>문의 유형</dt><dd>{inquiryTypeLabel(inquiry.inquiry_type)}</dd>
        <dt>관심 교육 분야</dt><dd>{program?.name ?? inquiry.program_slug ?? "선택 안 함"}</dd>
        <dt>문의자</dt><dd>{inquiry.sender_name}</dd>
        <dt>회신 이메일</dt><dd>{inquiry.sender_email}</dd>
        <dt>개인정보 동의</dt><dd>{inquiry.privacy_policy_version} · {inquiryDate(inquiry.privacy_consented_at)}</dd>
      </dl>
      <section className={styles.history}>
        <h2>문의 내용</h2>
        <p className={styles.inquiryMessage}>{inquiry.message}</p>
      </section>
      <InquiryStatusEditor id={id} status={inquiry.status} revision={inquiry.revision} nextStatuses={nextStatuses} />
      <section className={styles.history}>
        <h2>최근 상태 변경 이력</h2>
        {historyError ? (
          <p role="alert">변경 이력을 불러오지 못했습니다.</p>
        ) : history?.length ? (
          <ol>
            {history.map((event) => (
              <li key={event.id}>
                <div>{inquiryStatusLabel(event.previous_status)} → {inquiryStatusLabel(event.next_status)}</div>
                <time dateTime={event.created_at}>{inquiryDate(event.created_at)}</time>
                {" · 관리자 ID "}{event.actor_user_id}
              </li>
            ))}
          </ol>
        ) : <p>상태 변경 이력이 없습니다.</p>}
      </section>
      <Link href={backHref}>문의 목록으로 돌아가기</Link>
    </section>
  );
}
