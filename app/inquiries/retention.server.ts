type RetentionEnvironment = NodeJS.ProcessEnv;

export type InquiryRetentionPolicy = {
  privacyPolicyVersion: string;
  retentionDays: number;
};

export type InquiryRetentionPolicyReadiness =
  | { ready: false; reason: "missing_policy_version" | "missing_retention_days" | "invalid_retention_days" }
  | { ready: true; policy: InquiryRetentionPolicy };

function text(value: string | undefined) {
  return value?.trim() ?? "";
}

function parsePositiveInteger(value: string) {
  if (!/^[1-9]\d*$/u.test(value)) return null;

  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

export function getInquiryRetentionPolicy(
  environment: RetentionEnvironment = process.env,
): InquiryRetentionPolicyReadiness {
  const privacyPolicyVersion = text(environment.PRIVACY_POLICY_VERSION);
  if (!privacyPolicyVersion || privacyPolicyVersion.length > 64) {
    return { ready: false, reason: "missing_policy_version" };
  }

  const retentionDays = text(environment.INQUIRY_RETENTION_DAYS);
  if (!retentionDays) {
    return { ready: false, reason: "missing_retention_days" };
  }

  const parsedRetentionDays = parsePositiveInteger(retentionDays);
  if (!parsedRetentionDays) {
    return { ready: false, reason: "invalid_retention_days" };
  }

  return {
    ready: true,
    policy: { privacyPolicyVersion, retentionDays: parsedRetentionDays },
  };
}

export function calculateRetentionDueAt(receivedAt: Date, retentionDays: number) {
  if (Number.isNaN(receivedAt.getTime()) || !Number.isSafeInteger(retentionDays) || retentionDays < 1) {
    return null;
  }

  const dueAt = new Date(receivedAt);
  dueAt.setUTCDate(dueAt.getUTCDate() + retentionDays);

  return Number.isNaN(dueAt.getTime()) ? null : dueAt;
}
