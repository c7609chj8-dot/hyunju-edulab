import { inquiryTypeOptions, type InquiryType } from "./contract";
import type { InquirySubmission } from "./validation";
import { programs } from "../programs";

const notificationEnvironmentVariables = [
  "EMAIL_PROVIDER",
  "EMAIL_API_KEY",
  "EMAIL_FROM",
  "INQUIRY_NOTIFICATION_TO",
] as const;

type NotificationEnvironmentVariable = (typeof notificationEnvironmentVariables)[number];

type NotificationEnvironment = NodeJS.ProcessEnv;

export type InquiryNotificationTarget = {
  provider: string;
  from: string;
  to: string;
};

export type InquiryNotificationReadiness =
  | { ready: false; reason: "disabled" }
  | { ready: false; reason: "incomplete"; missing: NotificationEnvironmentVariable[] }
  | { ready: true; target: InquiryNotificationTarget };

export type StoredInquiryForNotification = InquirySubmission & {
  inquiryNumber: string;
  receivedAt: string;
};

export type RenderedInquiryNotification = {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
};

const inquiryTypeLabels = new Map<InquiryType, string>(
  inquiryTypeOptions.map(({ value, label }) => [value, label]),
);
const programNames = new Map(programs.map(({ slug, name }) => [slug, name]));

function valueOf(value: string | undefined) {
  return value?.trim() ?? "";
}

function oneLine(value: string) {
  return value.replace(/[\r\n]+/gu, " ").trim();
}

function multiline(value: string) {
  return value.replace(/\r\n?/gu, "\n").trim();
}

export function getInquiryNotificationReadiness(
  environment: NotificationEnvironment = process.env,
): InquiryNotificationReadiness {
  if (environment.INQUIRY_NOTIFICATION_ENABLED !== "true") {
    return { ready: false, reason: "disabled" };
  }

  const missing = notificationEnvironmentVariables.filter(
    (variable) => !valueOf(environment[variable]),
  );
  if (missing.length > 0) {
    return { ready: false, reason: "incomplete", missing };
  }

  return {
    ready: true,
    target: {
      provider: valueOf(environment.EMAIL_PROVIDER),
      from: valueOf(environment.EMAIL_FROM),
      to: valueOf(environment.INQUIRY_NOTIFICATION_TO),
    },
  };
}

export function buildNewInquiryNotification(
  inquiry: StoredInquiryForNotification,
  target: InquiryNotificationTarget,
): RenderedInquiryNotification {
  const programName = inquiry.programSlug ? programNames.get(inquiry.programSlug) ?? inquiry.programSlug : "선택 안 함";
  const inquiryType = inquiryTypeLabels.get(inquiry.inquiryType) ?? inquiry.inquiryType;
  const inquiryNumber = oneLine(inquiry.inquiryNumber);

  return {
    from: target.from,
    to: target.to,
    replyTo: inquiry.senderEmail,
    subject: `[현주에듀랩] 새 문의 ${inquiryNumber}`,
    text: [
      "새 문의가 저장되었습니다.",
      "",
      `접수 번호: ${inquiryNumber}`,
      `접수 시각: ${oneLine(inquiry.receivedAt)}`,
      `문의 유형: ${oneLine(inquiryType)}`,
      `관심 교육 분야: ${oneLine(programName)}`,
      `이름 또는 기관명: ${oneLine(inquiry.senderName)}`,
      `회신 이메일: ${oneLine(inquiry.senderEmail)}`,
      "",
      "문의 내용",
      multiline(inquiry.message),
    ].join("\n"),
  };
}
