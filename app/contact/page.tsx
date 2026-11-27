import { pageMetadata } from "../seo";
import ContactForm from "./contact-form";
import { programs } from "../programs";
import { digitalServices } from "../digital/services";
import { siteContact } from "../site-contact";

export const metadata = pageMetadata("/contact", "강의·교육 전화 문의 | 현주에듀랩", "강의 일정과 교육 프로그램은 010-7259-2558로 문의해 주세요.", false);

type ContactPageProps = { searchParams: Promise<{ program?: string | string[]; service?: string | string[] }> };

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { program, service } = await searchParams;
  const selectedProgram = typeof program === "string" ? programs.find((item) => item.slug === program) : undefined;
  const selectedService = !selectedProgram && typeof service === "string" ? digitalServices.find((item) => item.slug === service) : undefined;
  return (
    <section className="shell section content-page">
      <p className="eyebrow">CONTACT</p>
      <h1>강의·교육 문의</h1>
      <p className="page-lead">강의 일정과 교육 프로그램, 교육자료 제작·디지털 서비스는 전화로 문의해 주세요.</p>
      <section className="contact-callout" aria-labelledby="contact-phone-heading">
        <h2 id="contact-phone-heading">전화로 문의하기</h2>
        <p>교육 대상·희망 주제·일정을 알려주시면 상담에 도움이 됩니다.</p>
        <a className="contact-phone-link" href={siteContact.phoneHref}>
          <span>전화 문의</span>
          <strong>{siteContact.phone}</strong>
        </a>
        <p className="contact-callout-note">휴대전화에서는 위 버튼을 눌러 전화 앱을 열 수 있습니다. 컴퓨터에서는 번호를 확인한 뒤 전화해 주세요.</p>
      </section>
      <details className="contact-example">
        <summary>입력 예시 확인하기 (문의 접수 기능은 준비 중)</summary>
        <p id="contact-preview" className="contact-preview">
          아래 양식은 입력 형식 확인용 예시입니다. 입력 내용은 전송·저장되지 않으며 문의가 접수되지 않습니다. 실제 문의는 위 전화번호를 이용해 주세요. 예시 양식에는 실제 개인정보를 입력하지 마세요.
        </p>
        <ContactForm key={selectedProgram ? `program-${selectedProgram.slug}` : selectedService ? `service-${selectedService.slug}` : "general"} initialProgramSlug={selectedProgram?.slug ?? ""} initialInquiryType={selectedService?.inquiryType ?? ""} />
      </details>
    </section>
  );
}
