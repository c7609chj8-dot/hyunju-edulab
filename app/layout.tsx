import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import Navigation from "./navigation";
import InquiryQrCode from "./inquiry-qr-code";
import { siteLinks } from "./site-links";
import { productionIndexing, searchVerification, serializeStructuredData, siteUrl, websiteStructuredData } from "./seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "현주에듀랩 | 안전교육·AI 활용교육",
  description: "학교·교육기관·기업을 위한 안전교육·환경교육·AI 활용교육. 최현주 강사가 현장에 맞는 참여형 교육을 설계합니다.",
  verification: searchVerification(),
  robots: { index: productionIndexing, follow: true },
  icons: { icon: "/icon.svg" },
};

function Brand() {
  return (
    <Link href="/" className="brand" aria-label="현주에듀랩 홈">
      <svg aria-hidden="true" width="42" height="42" viewBox="0 0 42 42">
        <rect width="42" height="42" rx="12" fill="#7ee2ca" />
        <path d="M21 14c-4-3-8-3-12-2v17c4-1 8-1 12 2 4-3 8-3 12-2V12c-4-1-8-1-12 2v17" fill="none" stroke="#081924" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="m24 21 2 2 4-5" fill="none" stroke="#087f76" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>현주에듀랩 <small>HYUNJU EDU LAB</small></span>
    </Link>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeStructuredData(websiteStructuredData()) }} />
        <a className="skip-link" href="#main">본문으로 이동</a>
        <header className="site-header">
          <div className="shell header-inner">
            <Brand />
            <Navigation />
          </div>
        </header>
        <main id="main" tabIndex={-1}>{children}</main>
        <footer className="site-footer">
          <div className="shell footer-inner">
            <div>
              <Brand />
              <p className="footer-description">학교·교육기관·기업을 위한<br />안전·환경·AI 활용 교육</p>
            </div>
            <nav className="footer-links" aria-label="하단 메뉴">
              {siteLinks.map(({ href, label }) => (
                <Link key={href} href={href}>{label}</Link>
              ))}
              <Link href="/signup">회원가입</Link>
              <Link href="/login">로그인</Link>
              <Link href="/account">내 계정</Link>
              <Link href="/admin/login">관리자</Link>
              <Link href="/privacy">개인정보 처리방침</Link>
            </nav>
            <InquiryQrCode />
          </div>
        </footer>
      </body>
    </html>
  );
}
