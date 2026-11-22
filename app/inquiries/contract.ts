export const inquiryTypeOptions = [
  { value: "safety", label: "안전교육" },
  { value: "ai", label: "AI교육" },
  { value: "lecture", label: "강의 의뢰" },
  { value: "collaboration", label: "협업" },
] as const;

export type InquiryType = (typeof inquiryTypeOptions)[number]["value"];
export type InquiryCategory = InquiryType;

export const inquiryTypeValues = new Set<InquiryType>(inquiryTypeOptions.map(({ value }) => value));
