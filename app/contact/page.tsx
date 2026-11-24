import { pageMetadata } from "../seo";
import ContactForm from "./contact-form";
import { programs } from "../programs";
import { digitalServices } from "../digital/services";
import { getInquiryRetentionPolicy } from "../inquiries/retention.server";

export const metadata = pageMetadata("/contact", "문의 | 현주에듀랩", "현주에듀랩의 강의와 교육자료 제작 문의 화면입니다.", false);

type ContactPageProps = { searchParams: Promise<{ program?: string | string[]; service?: string | string[] }> };

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { program, service } = await searchParams;
  const selectedProgram = typeof program === "string" ? programs.find((item) => item.slug === program) : undefined;
  const selectedService = !selectedProgram && typeof service === "string" ? digitalServices.find((item) => item.slug === service) : undefined;
  const retention = getInquiryRetentionPolicy();
  const intake = retention.ready
    && process.env.INQUIRY_API_ENABLED === "true"
    && process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    && process.env.INQUIRY_SUPABASE_SECRET_KEY?.trim()
    ? retention.policy
    : null;
  return (
    <section className="shell section content-page">
      <p className="eyebrow">CONTACT</p>
      <h1>문의</h1>
      <p className="page-lead">강의, 교육자료 제작, 디지털 서비스에 관해 문의할 수 있는 화면입니다.</p>
      <p id="contact-preview" className="contact-preview">
        {intake
          ? "문의가 접수되면 접수번호를 안내합니다."
          : "현재는 입력 확인용 화면입니다. 예시 정보를 사용해 주세요. 입력 내용은 전송하거나 저장하지 않습니다."}
      </p>
      <ContactForm key={selectedProgram ? `program-${selectedProgram.slug}` : selectedService ? `service-${selectedService.slug}` : "general"} intake={intake} initialProgramSlug={selectedProgram?.slug ?? ""} initialInquiryType={selectedService?.inquiryType ?? ""} />
    </section>
  );
}
