export const inquiryTypeOptions = [
  { value: "lecture", label: "강의 의뢰" },
  { value: "materials", label: "교육자료 제작" },
  { value: "ai", label: "AI 활용교육" },
  { value: "website", label: "홈페이지 제작" },
  { value: "automation", label: "업무자동화" },
  { value: "other", label: "기타" },
] as const;

export type InquiryType = (typeof inquiryTypeOptions)[number]["value"];

export const inquiryTypeValues = new Set<InquiryType>(inquiryTypeOptions.map(({ value }) => value));
