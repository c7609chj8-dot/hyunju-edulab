import { calculateRetentionDueAt, type InquiryRetentionPolicy } from "./retention.server";
import type { InquirySubmission } from "./validation";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const inquiryNumberPattern = /^HJ-[A-HJ-NP-Z2-9]{12}$/u;
const sha256HexPattern = /^[0-9a-f]{64}$/iu;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseUuid(value: unknown) {
  const candidate = text(value);
  return uuidPattern.test(candidate) ? candidate.toLowerCase() : null;
}

function parseInquiryNumber(value: unknown) {
  const candidate = text(value);
  return inquiryNumberPattern.test(candidate) ? candidate : null;
}

function parseSha256Hash(value: unknown) {
  const candidate = text(value);
  return sha256HexPattern.test(candidate) ? candidate.toLowerCase() : null;
}

function isValidRetentionPolicy(policy: unknown): policy is InquiryRetentionPolicy {
  if (typeof policy !== "object" || policy === null || Array.isArray(policy)) return false;

  const candidate = policy as Partial<InquiryRetentionPolicy>;
  const privacyPolicyVersion = text(candidate.privacyPolicyVersion);
  const retentionDays = candidate.retentionDays;
  return (
    privacyPolicyVersion.length > 0
    && privacyPolicyVersion.length <= 64
    && typeof retentionDays === "number"
    && Number.isSafeInteger(retentionDays)
    && retentionDays >= 1
  );
}

export type NewInquiryPersistenceInput = {
  submission: InquirySubmission;
  inquiryId: unknown;
  inquiryNumber: unknown;
  idempotencyKeyHash: unknown;
  requestFingerprint: unknown;
  receivedAt: Date;
  retentionPolicy: InquiryRetentionPolicy;
};

export type NewInquiryRecord = InquirySubmission & {
  id: string;
  inquiryNumber: string;
  idempotencyKeyHash: string;
  requestFingerprint: string;
  privacyConsentedAt: string;
  status: "received";
  revision: 1;
  createdAt: string;
  updatedAt: string;
  retentionDueAt: string;
};

export type SubmittedInquiryEvent = {
  inquiryId: string;
  actorType: "system";
  actorUserId: null;
  eventType: "submitted";
  previousStatus: null;
  nextStatus: "received";
  createdAt: string;
};

export type NewInquiryPersistencePlan = {
  inquiry: NewInquiryRecord;
  submittedEvent: SubmittedInquiryEvent;
};

export type NewInquiryPersistencePlanResult =
  | { valid: true; plan: NewInquiryPersistencePlan }
  | {
      valid: false;
      reason:
        | "invalid_inquiry_id"
        | "invalid_inquiry_number"
        | "invalid_idempotency_key_hash"
        | "invalid_request_fingerprint"
        | "invalid_received_at"
        | "invalid_retention_policy"
        | "policy_version_mismatch";
    };

export function createNewInquiryPersistencePlan(
  input: NewInquiryPersistenceInput,
): NewInquiryPersistencePlanResult {
  const inquiryId = parseUuid(input.inquiryId);
  if (!inquiryId) return { valid: false, reason: "invalid_inquiry_id" };

  const inquiryNumber = parseInquiryNumber(input.inquiryNumber);
  if (!inquiryNumber) return { valid: false, reason: "invalid_inquiry_number" };

  const idempotencyKeyHash = parseSha256Hash(input.idempotencyKeyHash);
  if (!idempotencyKeyHash) return { valid: false, reason: "invalid_idempotency_key_hash" };

  const requestFingerprint = parseSha256Hash(input.requestFingerprint);
  if (!requestFingerprint) return { valid: false, reason: "invalid_request_fingerprint" };

  if (!(input.receivedAt instanceof Date) || Number.isNaN(input.receivedAt.getTime())) {
    return { valid: false, reason: "invalid_received_at" };
  }

  if (!isValidRetentionPolicy(input.retentionPolicy)) {
    return { valid: false, reason: "invalid_retention_policy" };
  }

  const privacyPolicyVersion = text(input.retentionPolicy.privacyPolicyVersion);
  const submissionPolicyVersion = text(input.submission.privacyPolicyVersion);
  if (!submissionPolicyVersion || submissionPolicyVersion !== privacyPolicyVersion) {
    return { valid: false, reason: "policy_version_mismatch" };
  }

  const retentionDueAt = calculateRetentionDueAt(input.receivedAt, input.retentionPolicy.retentionDays);
  if (!retentionDueAt) return { valid: false, reason: "invalid_retention_policy" };

  const receivedAt = input.receivedAt.toISOString();

  return {
    valid: true,
    plan: {
      inquiry: {
        id: inquiryId,
        inquiryNumber,
        idempotencyKeyHash,
        requestFingerprint,
        ...input.submission,
        privacyPolicyVersion,
        privacyConsentedAt: receivedAt,
        status: "received",
        revision: 1,
        createdAt: receivedAt,
        updatedAt: receivedAt,
        retentionDueAt: retentionDueAt.toISOString(),
      },
      submittedEvent: {
        inquiryId,
        actorType: "system",
        actorUserId: null,
        eventType: "submitted",
        previousStatus: null,
        nextStatus: "received",
        createdAt: receivedAt,
      },
    },
  };
}

export type SaveNewInquiryResult =
  | { outcome: "created"; inquiryNumber: string; createdAt: string }
  | { outcome: "replayed"; inquiryNumber: string; createdAt: string }
  | { outcome: "idempotency_conflict" };

/**
 * Implementations must atomically insert the inquiry and submitted event. They
 * must use the idempotency key hash as a unique key,
 * replay only when the stored request fingerprint matches, and never log the
 * plan's personal data or return it to a public caller.
 */
export interface InquiryPersistenceAdapter {
  saveNewInquiry(plan: NewInquiryPersistencePlan): Promise<SaveNewInquiryResult>;
}
