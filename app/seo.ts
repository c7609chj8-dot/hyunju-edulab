import type { Metadata } from "next";

export const siteUrl = "https://hyunju-edulab.vercel.app";
export const siteName = "현주에듀랩";
export const productionIndexing = process.env.VERCEL_ENV === "production" || (!process.env.VERCEL_ENV && process.env.NODE_ENV === "production");

export function pageMetadata(path: string, title: string, description: string, indexable = true): Metadata {
  const url = new URL(path, siteUrl).href;
  const image = { url: `${siteUrl}/images/school-safety-class.jpg`, width: 4032, height: 3024, alt: "학생들과 함께하는 현주에듀랩 안전교육 현장" };
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: productionIndexing && indexable, follow: true },
    openGraph: { type: "website", locale: "ko_KR", siteName, url, title, description, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}
