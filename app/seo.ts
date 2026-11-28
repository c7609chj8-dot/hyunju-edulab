import type { Metadata } from "next";

export const siteUrl = "https://hyunjulab.com";
export const siteName = "현주에듀랩";
export const productionIndexing = process.env.VERCEL_ENV === "production" || (!process.env.VERCEL_ENV && process.env.NODE_ENV === "production");

export function pageMetadata(path: string, title: string, description: string, indexable = true): Metadata {
  const url = canonicalUrl(path);
  const image = { url: `${siteUrl}/images/school-safety-class-privacy-v1.jpg`, width: 1448, height: 1086, alt: "학생들과 함께하는 현주에듀랩 안전교육 현장" };
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: productionIndexing && indexable && !/^\/(admin|account|auth|api|login|signup|contact|privacy)(\/|$)/.test(new URL(url).pathname), follow: true },
    openGraph: { type: "website", locale: "ko_KR", siteName, url, title, description, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

type VerificationEnvironment = Record<string, string | undefined>;

export function canonicalUrl(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("Canonical paths must be site-relative.");
  }
  const url = new URL(path, siteUrl);
  if (url.origin !== siteUrl) throw new Error("Canonical URL must use the primary domain.");
  url.search = "";
  url.hash = "";
  return url.href;
}

export function searchVerification(environment: VerificationEnvironment = process.env): Metadata["verification"] {
  const google = environment.GOOGLE_SITE_VERIFICATION?.trim();
  const naver = environment.NAVER_SITE_VERIFICATION?.trim();
  if (!google && !naver) return undefined;
  return {
    ...(google ? { google } : {}),
    ...(naver ? { other: { "naver-site-verification": naver } } : {}),
  };
}

export function websiteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    alternateName: "HYUNJU EDU LAB",
    url: canonicalUrl("/"),
    description: "학교·교육기관·기업을 위한 안전교육·환경교육·AI 활용교육",
    inLanguage: "ko-KR",
  };
}

export function instructorStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "최현주",
    url: canonicalUrl("/about"),
    jobTitle: "안전교육·AI 활용교육 강사",
    knowsAbout: ["학교안전교육", "건설·산업안전교육", "환경교육", "AI 활용교육"],
  };
}

export function breadcrumbStructuredData(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(({ name, path }, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: canonicalUrl(path),
    })),
  };
}

export function serializeStructuredData(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
