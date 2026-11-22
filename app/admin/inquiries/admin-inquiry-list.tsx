"use client";

import { useState } from "react";
import { inquiryStatusLabels, isInquiryStatus, type InquiryStatus } from "../../inquiries/workflow";

export type AdministratorInquiry = {
  id: string;
  inquiryNumber: string;
  category: string;
  programSlug: string | null;
  senderName: string;
  senderContact: string;
  senderEmail: string | null;
  message: string;
  status: InquiryStatus;
  revision: number;
  createdAt: string;
};

const categoryLabels: Record<string, string> = {
  safety: "안전교육",
  ai: "AI교육",
  lecture: "강의 의뢰",
  collaboration: "협업",
};

const nextStatusOptions: Record<InquiryStatus, readonly InquiryStatus[]> = {
  received: ["received", "reviewing"],
  reviewing: ["reviewing", "answered"],
  answered: ["answered"],
};

function displayDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(date);
}

export default function AdminInquiryList({ inquiries }: { inquiries: AdministratorInquiry[] }) {
  const [items, setItems] = useState(inquiries);
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function updateStatus(inquiry: AdministratorInquiry, nextStatus: InquiryStatus) {
    if (nextStatus === inquiry.status) return;

    setMessage("");
    setUpdatingId(inquiry.id);
    try {
      const response = await fetch(`/api/admin/inquiries/${inquiry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, revision: inquiry.revision }),
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok || !payload || typeof payload !== "object" || Array.isArray(payload)) {
        setMessage("상태를 저장하지 못했습니다. 목록을 새로고침한 뒤 다시 시도해 주세요.");
        return;
      }

      const record = payload as Record<string, unknown>;
      const updatedStatus = record.status;
      const updatedRevision = record.revision;
      if (!isInquiryStatus(updatedStatus) || typeof updatedRevision !== "number") {
        setMessage("상태를 저장하지 못했습니다. 목록을 새로고침한 뒤 다시 시도해 주세요.");
        return;
      }

      setItems((current) => current.map((item) => (
        item.id === inquiry.id
          ? { ...item, status: updatedStatus, revision: updatedRevision }
          : item
      )));
      setMessage("상태를 저장했습니다.");
    } catch {
      setMessage("네트워크 오류로 상태를 저장하지 못했습니다.");
    } finally {
      setUpdatingId(null);
    }
  }

  if (items.length === 0) {
    return <p className="contact-preview">테스트 문의가 아직 없습니다.</p>;
  }

  return (
    <>
      <p className="admin-help">테스트 데이터만 표시합니다. 상태 변경은 기록으로 남으며, 답변 완료 상태는 다시 열 수 없습니다.</p>
      <div className="admin-inquiry-list">
        {items.map((inquiry) => (
          <article className="admin-inquiry-card" key={inquiry.id}>
            <div className="admin-inquiry-heading">
              <div>
                <p className="eyebrow">{inquiry.inquiryNumber}</p>
                <h2>{categoryLabels[inquiry.category] ?? inquiry.category}</h2>
              </div>
              <time dateTime={inquiry.createdAt}>{displayDate(inquiry.createdAt)}</time>
            </div>
            <dl className="admin-inquiry-details">
              <div><dt>이름</dt><dd>{inquiry.senderName}</dd></div>
              <div><dt>연락처</dt><dd>{inquiry.senderContact}</dd></div>
              <div><dt>이메일</dt><dd>{inquiry.senderEmail || "입력 안 함"}</dd></div>
              <div><dt>관심 교육</dt><dd>{inquiry.programSlug || "선택 안 함"}</dd></div>
            </dl>
            <p className="admin-inquiry-message">{inquiry.message}</p>
            <label className="admin-status-control" htmlFor={`status-${inquiry.id}`}>
              처리 상태
              <select
                id={`status-${inquiry.id}`}
                value={inquiry.status}
                disabled={updatingId === inquiry.id || inquiry.status === "answered"}
                onChange={(event) => updateStatus(inquiry, event.currentTarget.value as InquiryStatus)}
              >
                {nextStatusOptions[inquiry.status].map((status) => (
                  <option key={status} value={status}>{inquiryStatusLabels[status]}</option>
                ))}
              </select>
            </label>
          </article>
        ))}
      </div>
      <p className="contact-status" role="status">{message}</p>
    </>
  );
}
