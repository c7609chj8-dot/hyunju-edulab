"use client";

import { useState, type FormEvent } from "react";

export default function ContactForm() {
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
      <p>모든 항목은 필수입니다.</p>
      <label htmlFor="inquiry-type">문의 유형</label>
      <select id="inquiry-type" defaultValue="" required>
        <option value="" disabled>문의 유형 선택</option>
        <option value="lecture">강의 의뢰</option>
        <option value="materials">교육자료 제작</option>
        <option value="ai">AI 활용교육</option>
        <option value="other">기타</option>
      </select>
      <label htmlFor="inquiry-sender">이름 또는 기관명</label>
      <input id="inquiry-sender" required pattern=".*\S.*" maxLength={80} />
      <label htmlFor="inquiry-email">회신 이메일</label>
      <input id="inquiry-email" type="email" placeholder="sample@example.com" maxLength={254} required />
      <label htmlFor="inquiry-message">문의 내용</label>
      <textarea
        id="inquiry-message"
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
        <input type="checkbox" required />
        입력 확인용 화면이라는 안내를 확인했습니다.
      </label>
      <button className="button" type="submit">입력 확인</button>
      <p className="contact-status" role="status">
        {validated ? "입력 형식을 확인했습니다. 문의가 접수되지는 않았습니다." : ""}
      </p>
    </form>
  );
}
