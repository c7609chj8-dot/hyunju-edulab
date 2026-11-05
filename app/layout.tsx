import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "현주에듀랩 | 안전·환경·AI 교육",
  description: "학교, 교육기관, 기업을 위한 안전·환경·AI 활용 교육",
};

function Brand() {
  return (
    <Link href="/" className="brand" aria-label="현주에듀랩 홈">
      <svg aria-hidden="true" width="42" height="42" viewBox="0 0 42 42">
        <rect width="42" height="42" rx="12" fill="#102840" />
        <path d="M21 14c-4-3-8-3-12-2v17c4-1 8-1 12 2 4-3 8-3 12-2V12c-4-1-8-1-12 2v17" fill="none" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="m24 21 2 2 4-5" fill="none" stroke="#7ee2ca" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>현주에듀랩 <small>HYUNJU EDU LAB</small></span>
    </Link>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <a className="skip-link" href="#main">본문으로 이동</a>
        <header className="site-header">
          <div className="shell header-inner">
            <Brand />
            <nav aria-label="주요 메뉴">
              <Link href="/#programs">교육 분야</Link>
              <Link href="/#materials">교육자료</Link>
            </nav>
          </div>
        </header>
        <main id="main" tabIndex={-1}>{children}</main>
        <footer className="site-footer">
          <div className="shell footer-inner">
            <Brand />
            <p>안전·환경·AI 활용 교육</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
