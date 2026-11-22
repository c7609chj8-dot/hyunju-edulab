import type { InquiryAdministrationAccess } from "./admin-authorization";

export const inquiryStatusValues = ["received", "reviewing", "answered"] as const;

export type InquiryStatus = (typeof inquiryStatusValues)[number];

const inquiryStatusSet = new Set<InquiryStatus>(inquiryStatusValues);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

const allowedNextStatuses: Record<InquiryStatus, readonly InquiryStatus[]> = {
  received: ["reviewing"],
  reviewing: ["answered"],
  answered: [],
};

export const inquiryStatusLabels: Record<InquiryStatus, string> = {
  received: "접수",
  reviewing: "확인 중",
  answered: "답변 완료",
};

export type InquiryStatusTransition = {
  previousStatus: InquiryStatus;
  nextStatus: InquiryStatus;
};

export type InquiryStatusTransitionValidation =
  | { valid: true; transition: InquiryStatusTransition }
  | {
      valid: false;
      reason: "invalid_current_status" | "invalid_next_status" | "same_status" | "invalid_transition";
    };

export function isInquiryStatus(value: unknown): value is InquiryStatus {
  return typeof value === "string" && inquiryStatusSet.has(value as InquiryStatus);
}

export function validateInquiryStatusTransition(
  currentStatus: unknown,
  nextStatus: unknown,
): InquiryStatusTransitionValidation {
  if (!isInquiryStatus(currentStatus)) return { valid: false, reason: "invalid_current_status" };
  if (!isInquiryStatus(nextStatus)) return { valid: false, reason: "invalid_next_status" };
  if (currentStatus === nextStatus) return { valid: false, reason: "same_status" };
  if (!allowedNextStatuses[currentStatus].includes(nextStatus)) {
    return { valid: false, reason: "invalid_transition" };
  }

  return { valid: true, transition: { previousStatus: currentStatus, nextStatus } };
}

function parseUuid(value: unknown) {
  const candidate = typeof value === "string" ? value.trim() : "";
  return uuidPattern.test(candidate) ? candidate.toLowerCase() : null;
}

function isPositiveRevision(value: unknown): value is number {
  return (
    typeof value === "number"
    && Number.isSafeInteger(value)
    && value >= 1
    && value < Number.MAX_SAFE_INTEGER
  );
}

export type InquiryStatusChangeInput = {
  access: InquiryAdministrationAccess;
  inquiryId: unknown;
  currentStatus: unknown;
  nextStatus: unknown;
  expectedRevision: unknown;
  requestId?: unknown;
};

export type InquiryStatusChangedAuditEvent = {
  actorUserId: string;
  action: "status_changed";
  targetType: "inquiry";
  targetId: string;
  previousStatus: InquiryStatus;
  nextStatus: InquiryStatus;
  requestId: string | null;
};

export type PreparedInquiryStatusChange = {
  inquiryId: string;
  expectedRevision: number;
  nextRevision: number;
  transition: InquiryStatusTransition;
  auditEvent: InquiryStatusChangedAuditEvent;
};

export type InquiryStatusChangePreparation =
  | { valid: true; change: PreparedInquiryStatusChange }
  | {
      valid: false;
      reason:
        | "unauthenticated"
        | "forbidden"
        | "invalid_administrator_id"
        | "invalid_inquiry_id"
        | "invalid_request_id"
        | "invalid_revision"
        | "invalid_current_status"
        | "invalid_next_status"
        | "same_status"
        | "invalid_transition";
    };

export function prepareInquiryStatusChange(
  input: InquiryStatusChangeInput,
): InquiryStatusChangePreparation {
  if (!input.access.allowed) return { valid: false, reason: input.access.reason };

  const actorUserId = parseUuid(input.access.authUserId);
  if (!actorUserId) return { valid: false, reason: "invalid_administrator_id" };

  const inquiryId = parseUuid(input.inquiryId);
  if (!inquiryId) return { valid: false, reason: "invalid_inquiry_id" };

  const requestId =
    input.requestId === undefined || input.requestId === null ? null : parseUuid(input.requestId);
  if (input.requestId !== undefined && input.requestId !== null && !requestId) {
    return { valid: false, reason: "invalid_request_id" };
  }

  if (!isPositiveRevision(input.expectedRevision)) {
    return { valid: false, reason: "invalid_revision" };
  }

  const transition = validateInquiryStatusTransition(input.currentStatus, input.nextStatus);
  if (!transition.valid) return transition;

  return {
    valid: true,
    change: {
      inquiryId,
      expectedRevision: input.expectedRevision,
      nextRevision: input.expectedRevision + 1,
      transition: transition.transition,
      auditEvent: {
        actorUserId,
        action: "status_changed",
        targetType: "inquiry",
        targetId: inquiryId,
        previousStatus: transition.transition.previousStatus,
        nextStatus: transition.transition.nextStatus,
        requestId,
      },
    },
  };
}
