import { NextResponse } from "next/server";
import { validateInquirySubmission } from "../../inquiries/validation";

const responseHeaders = { "Cache-Control": "no-store" };

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status, headers: responseHeaders });
}

function unavailable() {
  return json(
    { error: "inquiry_backend_not_configured", message: "문의 접수 서비스는 아직 준비 중입니다." },
    503,
  );
}

export async function POST(request: Request) {
  if (process.env.INQUIRY_API_ENABLED !== "true") return unavailable();

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("application/json")) {
    return json({ error: "unsupported_media_type", message: "JSON 요청만 처리할 수 있습니다." }, 415);
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 12_000) {
    return json({ error: "payload_too_large", message: "요청 내용이 너무 큽니다." }, 413);
  }

  const requestId = crypto.randomUUID();
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    console.error("[inquiries] rejected malformed JSON", { requestId });
    return json({ error: "invalid_json", message: "요청 형식이 올바르지 않습니다." }, 400);
  }

  const validation = validateInquirySubmission(payload);
  if (!validation.valid) {
    return json({ error: "invalid_inquiry", fields: validation.errors }, 400);
  }

  console.error("[inquiries] submission blocked because no persistence adapter is configured", { requestId });
  return unavailable();
}
