import { programs } from "../programs";
import { inquiryTypeValues, type InquiryType } from "./contract";

const programSlugs = new Set(programs.map(({ slug }) => slug));
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const contactPattern = /^[0-9+().\-\s]{7,50}$/u;

export type InquirySubmission = {
  programSlug: string | null;
  inquiryType: InquiryType;
  senderName: string;
  senderContact: string;
  senderEmail: string | null;
  message: string;
  privacyPolicyVersion: string;
  privacyConsentedAt: string;
};

export type InquiryValidationResult =
  | { valid: true; data: InquirySubmission }
  | { valid: false; errors: Record<string, string> };

export type InquiryValidationOptions = {
  expectedPrivacyPolicyVersion?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateInquirySubmission(
  payload: unknown,
  options: InquiryValidationOptions = {},
): InquiryValidationResult {
  if (!isRecord(payload)) return { valid: false, errors: { form: "요청 형식이 올바르지 않습니다." } };

  const senderName = text(payload.senderName);
  const senderContact = text(payload.senderContact);
  const senderEmail = text(payload.senderEmail);
  const programSlug = text(payload.programSlug);
  const inquiryType = text(payload.inquiryType);
  const message = text(payload.message);
  const privacyPolicyVersion = text(payload.privacyPolicyVersion);
  const website = text(payload.website);
  const errors: Record<string, string> = {};

  if (website) errors.form = "요청을 처리할 수 없습니다.";
  if (!senderName || senderName.length > 80) errors.senderName = "이름을 확인해 주세요.";
  if (!senderContact || !contactPattern.test(senderContact)) errors.senderContact = "연락처를 확인해 주세요.";
  if (senderEmail && (senderEmail.length > 254 || !emailPattern.test(senderEmail))) {
    errors.senderEmail = "이메일을 확인해 주세요.";
  }
  if (programSlug && !programSlugs.has(programSlug)) errors.programSlug = "관심 교육 분야를 확인해 주세요.";
  if (!inquiryTypeValues.has(inquiryType as InquiryType)) errors.inquiryType = "문의 유형을 확인해 주세요.";
  if (!message || message.length > 2000) errors.message = "문의 내용을 확인해 주세요.";
  if (payload.privacyConsent !== true) errors.privacyConsent = "개인정보 수집·이용 동의가 필요합니다.";
  if (!privacyPolicyVersion || privacyPolicyVersion.length > 64) errors.privacyPolicyVersion = "개인정보 처리 기준을 확인해 주세요.";
  if (
    options.expectedPrivacyPolicyVersion
    && privacyPolicyVersion !== options.expectedPrivacyPolicyVersion
  ) {
    errors.privacyPolicyVersion = "최신 개인정보 처리 기준에 동의해 주세요.";
  }

  if (Object.keys(errors).length > 0) return { valid: false, errors };

  return {
    valid: true,
    data: {
      programSlug: programSlug || null,
      inquiryType: inquiryType as InquiryType,
      senderName,
      senderContact,
      senderEmail: senderEmail || null,
      message,
      privacyPolicyVersion,
      privacyConsentedAt: new Date().toISOString(),
    },
  };
}
