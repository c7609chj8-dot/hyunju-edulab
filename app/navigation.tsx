"use client";

import Link from "next/link";
import { useRef, useState } from "react";

const links = [
  { href: "/about", label: "강사 소개" },
  { href: "/education", label: "교육 프로그램" },
  { href: "/materials", label: "교육자료" },
  { href: "/digital", label: "디지털 서비스" },
  { href: "/contact", label: "문의" },
];

export default function Navigation() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);

  return (
    <div
      className="site-navigation"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open && toggle.current?.getClientRects().length) {
          setOpen(false);
          toggle.current.focus();
        }
      }}
    >
      <button
        ref={toggle}
        type="button"
        className="navigation-toggle"
        aria-expanded={open}
        aria-controls="site-navigation-links"
        onClick={() => setOpen(!open)}
      >
        메뉴
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">
          <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <nav id="site-navigation-links" className="navigation-links" aria-label="주요 메뉴">
        {links.map(({ href, label }) => (
          <Link key={href} href={href} onNavigate={() => setOpen(false)}>{label}</Link>
        ))}
      </nav>
    </div>
  );
}
