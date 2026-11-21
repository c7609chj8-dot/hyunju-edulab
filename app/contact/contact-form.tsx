"use client";

import { useState, type FormEvent } from "react";
import { inquiryTypeOptions } from "../inquiries/contract";
import { programs } from "../programs";

export default function ContactForm({ initialProgramSlug = "", initialInquiryType = "" }: { initialProgramSlug?: string; initialInquiryType?: string }) {
  const [validated, setValidated] = useState(false);

  function validate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidated(true);
  }

  return (
    <form
      className="contact-form"
      aria-describedby="contact-preview"
      onSubmit={validate}
      onChange={() => setValidated(false)}
    >
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
      <label className="contact-confirmation">
        <input name="acknowledgedPreview" type="checkbox" required />
        입력 확인용 화면이라는 안내를 확인했습니다.
      </label>
      <button className="button" type="submit">입력 확인</button>
      <p className="contact-status" role="status">
        {validated ? "입력 형식을 확인했습니다. 문의가 접수되지는 않았습니다." : ""}
      </p>
    </form>
  );
}
