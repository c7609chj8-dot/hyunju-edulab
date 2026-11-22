import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { InquirySubmission } from "./validation";

const inquiryAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function hashInquiryValue(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function createInquiryId() {
  return randomUUID();
}

export function createInquiryNumber() {
  const suffix = Array.from(randomBytes(12), (byte) => inquiryAlphabet[byte & 31]).join("");
  return `HJ-${suffix}`;
}

export function createInquiryRequestFingerprint(submission: InquirySubmission) {
  const canonicalSubmission = JSON.stringify({
    category: submission.inquiryType,
    email: submission.senderEmail,
    message: submission.message,
    name: submission.senderName,
    phone: submission.senderContact,
    policyVersion: submission.privacyPolicyVersion,
    programSlug: submission.programSlug,
  });

  return hashInquiryValue(canonicalSubmission);
}
