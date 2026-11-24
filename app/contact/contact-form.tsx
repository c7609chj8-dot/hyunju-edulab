"use client";

import { useRef, useState, type FormEvent } from "react";
import { inquiryTypeOptions } from "../inquiries/contract";
import { programs } from "../programs";

type ContactFormProps = {
  initialProgramSlug?: string;
  initialInquiryType?: string;
  intake: { privacyPolicyVersion: string; retentionDays: number } | null;
};

type SubmissionStatus =
  | { kind: "preview" }
  | { kind: "success"; inquiryNumber: string }
  | { kind: "error"; message: string };

export default function ContactForm({ initialProgramSlug = "", initialInquiryType = "", intake }: ContactFormProps) {
  const [status, setStatus] = useState<SubmissionStatus | null>(null);
  const [pending, setPending] = useState(false);
  const sending = useRef(false);
  const attempt = useRef<{ body: string; key: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    if (!intake) {
      setStatus({ kind: "preview" });
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    const body = JSON.stringify({
      programSlug: data.get("programSlug"),
      inquiryType: data.get("inquiryType"),
      senderName: String(data.get("senderName") ?? "").trim(),
      senderEmail: String(data.get("senderEmail") ?? "").trim(),
      message: String(data.get("message") ?? "").trim(),
      website: data.get("website"),
      privacyConsent: data.has("privacyConsent"),
      privacyPolicyVersion: intake.privacyPolicyVersion,
    });

    sending.current = true;
    setPending(true);
    setStatus(null);
    try {
      if (attempt.current?.body !== body) {
        attempt.current = { body, key: crypto.randomUUID() };
      }
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": attempt.current.key },
        body,
        signal: AbortSignal.timeout(15_000),
      });
      if (response.status === 400) {
        setStatus({ kind: "error", message: "입력 내용과 개인정보 동의를 확인한 뒤 다시 시도해 주세요." });
        return;
      }
      if (response.status === 409) {
        attempt.current = null;
        setStatus({ kind: "error", message: "접수 키가 충돌했습니다. 다시 제출해 주세요." });
        return;
      }
      if (!response.ok) throw new Error("Inquiry submission failed");
      const result = await response.json();
      if (
        !((response.status === 201 && result?.outcome === "created") || (response.status === 200 && result?.outcome === "replayed"))
        || typeof result.inquiryNumber !== "string"
        || !/^HJ-[A-HJ-NP-Z2-9]{12}$/u.test(result.inquiryNumber)
      ) throw new Error("Invalid inquiry receipt");

      attempt.current = null;
      form.reset();
      setStatus({ kind: "success", inquiryNumber: result.inquiryNumber });
    } catch {
      setStatus({ kind: "error", message: "접수 결과를 확인하지 못했습니다. 같은 내용으로 다시 시도해 주세요." });
    } finally {
      sending.current = false;
      setPending(false);
    }
  }

  return (
    <form
      className="contact-form"
      aria-describedby="contact-preview"
      method="post"
      action="/api/inquiries"
      onSubmit={submit}
      onChange={() => setStatus(null)}
    >
      <fieldset disabled={pending} aria-label="문의 정보">
        <p>관심 교육 분야를 제외한 모든 항목은 필수입니다.</p>
        <div className="inquiry-honeypot" aria-hidden="true">
          <label htmlFor="inquiry-website">홈페이지</label>
          <input id="inquiry-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>
        <label htmlFor="inquiry-program">관심 교육 분야 (선택)</label>
        <select id="inquiry-program" name="programSlug" defaultValue={initialProgramSlug}>
          <option value="">교육 분야 선택 안 함</option>
          {programs.map(({ slug, name }) => <option key={slug} value={slug}>{name}</option>)}
        </select>
        <label htmlFor="inquiry-type">문의 유형</label>
        <select id="inquiry-type" name="inquiryType" defaultValue={initialInquiryType || (initialProgramSlug === "ai" ? "ai" : initialProgramSlug ? "lecture" : "")} required>
          <option value="" disabled>문의 유형 선택</option>
          {inquiryTypeOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>
        <label htmlFor="inquiry-sender">이름 또는 기관명</label>
        <input id="inquiry-sender" name="senderName" required pattern=".*\S.*" maxLength={80} />
        <label htmlFor="inquiry-email">회신 이메일</label>
        <input id="inquiry-email" name="senderEmail" type="email" placeholder="sample@example.com" maxLength={254} required />
        <label htmlFor="inquiry-message">문의 내용</label>
        <textarea
          id="inquiry-message"
          name="message"
          rows={6}
          maxLength={2000}
          required
          onChange={({ currentTarget }) => {
            currentTarget.setCustomValidity(
              currentTarget.value && !currentTarget.value.trim() ? "문의 내용을 입력해 주세요." : "",
            );
          }}
        />
        {intake ? (
          <>
            <p id="inquiry-consent">
              문의 확인과 회신을 위해 이름 또는 기관명, 회신 이메일, 문의 내용, 문의 유형과 선택한 교육 분야,
              동의 버전과 시각을 접수일로부터 {intake.retentionDays}일간 보관합니다.
              동의를 거부할 수 있으며, 동의하지 않으면 문의를 접수할 수 없습니다.
              {" "}동의 버전 {intake.privacyPolicyVersion}
            </p>
            <label className="contact-confirmation">
              <input name="privacyConsent" type="checkbox" required aria-describedby="inquiry-consent" />
              문의 처리에 필요한 개인정보 수집·이용에 동의합니다.
            </label>
          </>
        ) : (
          <label className="contact-confirmation">
            <input name="acknowledgedPreview" type="checkbox" required />
            입력 확인용 화면이라는 안내를 확인했습니다.
          </label>
        )}
        <button className="button" type="submit">{intake ? (pending ? "접수 중…" : "문의 접수") : "입력 확인"}</button>
      </fieldset>
      <p className="contact-status" role="status">
        {status?.kind === "preview" && "입력 형식을 확인했습니다. 문의가 접수되지는 않았습니다."}
        {status?.kind === "success" && <>문의가 접수되었습니다. 접수번호 <strong>{status.inquiryNumber}</strong></>}
      </p>
      {status?.kind === "error" && <p role="alert">{status.message}</p>}
    </form>
  );
}
