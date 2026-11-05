import type { Metadata } from "next";
import ContactForm from "./contact-form";

export const metadata: Metadata = {
  title: "문의 | 현주에듀랩",
  description: "현주에듀랩의 강의와 교육자료 제작 문의 화면입니다.",
};

export default function ContactPage() {
  return (
    <section className="shell section content-page">
      <p className="eyebrow">CONTACT</p>
      <h1>문의</h1>
      <p className="page-lead">강의, 교육자료 제작, 디지털 서비스에 관해 문의할 수 있는 화면입니다.</p>
      <p id="contact-preview" className="contact-preview">
        현재는 입력 확인용 화면입니다. 예시 정보를 사용해 주세요. 입력 내용은 전송하거나 저장하지 않습니다.
      </p>
      <ContactForm />
    </section>
  );
}
