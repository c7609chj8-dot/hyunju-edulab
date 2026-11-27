export const siteLinks = [
  { href: "/education", label: "교육 프로그램" },
  { href: "/about", label: "강사 소개" },
  { href: "/materials", label: "교육자료실" },
  { href: "/portfolio", label: "진행 사례" },
  { href: "/digital", label: "디지털 지원" },
  { href: "/insights", label: "소식·정보" },
  { href: "/contact", label: "강의 문의" },
];

// Keep every public content page in the footer and sitemap.
// The header focuses on education, evidence, and inquiries.
export const primarySiteLinks = siteLinks.filter(({ href }) => href !== "/insights");
