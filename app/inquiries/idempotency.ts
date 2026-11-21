const idempotencyKeyPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{15,127}$/u;

export type IdempotencyKeyValidationResult =
  | { valid: true; key: string }
  | { valid: false; message: string };

export function validateIdempotencyKey(value: string | null): IdempotencyKeyValidationResult {
  const key = value?.trim() ?? "";

  if (!key) {
    return { valid: false, message: "중복 방지 키가 필요합니다." };
  }

  if (!idempotencyKeyPattern.test(key)) {
    return { valid: false, message: "중복 방지 키 형식이 올바르지 않습니다." };
  }

  return { valid: true, key };
}
