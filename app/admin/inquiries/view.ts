import { inquiryTypeOptions } from "../../inquiries/contract";
import { isInquiryStatus, type InquiryStatus } from "../../inquiries/workflow";

export const inquiryPageSize = 25;

export const inquiryStatusLabels: Record<InquiryStatus, string> = {
  new: "신규",
  in_progress: "처리 중",
  on_hold: "보류",
  completed: "완료",
  closed: "종결",
};

const inquiryTypeLabels: ReadonlyMap<string, string> = new Map(
  inquiryTypeOptions.map(({ value, label }) => [value, label]),
);

export function inquiryTypeLabel(type: string) {
  return inquiryTypeLabels.get(type) ?? type;
}

export function inquiryStatusLabel(status: string) {
  return isInquiryStatus(status) ? inquiryStatusLabels[status] : status;
}

export function inquiryDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

export type InquiryListParams = { status?: string | string[]; page?: string | string[] };

export function inquiryListSelection(params: InquiryListParams) {
  const status = isInquiryStatus(params.status) ? params.status : undefined;
  const page = typeof params.page === "string" && /^\d{1,7}$/u.test(params.page)
    ? Math.max(1, Number(params.page))
    : 1;
  return { status, page };
}

export function inquiryListQuery(status: InquiryStatus | undefined, page: number) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `?${query}` : "";
}
