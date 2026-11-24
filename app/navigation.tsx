"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { siteLinks } from "./site-links";

export default function Navigation() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const container = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !container.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function closeOnDesktop(event: MediaQueryListEvent) {
      if (event.matches) setOpen(false);
    }

    const desktop = window.matchMedia("(min-width: 72rem)");
    document.addEventListener("pointerdown", closeOutside);
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [open]);

  return (
    <div
      ref={container}
      className="site-navigation"
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
        }
      }}
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
        {siteLinks.map(({ href, label }) => {
          const currentPage = pathname === href;
          const currentSection = pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={href === "/contact" ? "navigation-contact" : undefined}
              aria-current={currentPage ? "page" : currentSection ? "location" : undefined}
              onNavigate={() => setOpen(false)}
            >
              {label}
            </Link>
          );
        })}
        <Link href="/signup" aria-current={pathname === "/signup" ? "page" : undefined} onNavigate={() => setOpen(false)}>
          회원가입
        </Link>
      </nav>
    </div>
  );
}
