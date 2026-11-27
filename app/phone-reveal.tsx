"use client";

import Script from "next/script";
import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState } from "react";

type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
declare global {
  interface Window { turnstile?: Turnstile }
}

export default function PhoneReveal({ variant = "inline" }: { variant?: "hero" | "contact" | "inline" }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const phoneLink = useRef<HTMLAnchorElement>(null);
  const widget = useRef<string | null>(null);
  const active = useRef<AbortController | null>(null);
  const headingId = useId();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const buttonClass = variant === "hero" ? "home-primary-button" : variant === "contact" ? "contact-phone-link" : "phone-inline-button";

  useEffect(() => {
    if (!open) return;
    const returnFocus = trigger.current;
    dialog.current?.showModal();
    return () => {
      active.current?.abort();
      active.current = null;
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = null;
      returnFocus?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (phone && !open) phoneLink.current?.focus();
  }, [phone, open]);

  useEffect(() => {
    if (!phone) return;
    const hide = () => setPhone("");
    const timer = window.setTimeout(hide, 300_000);
    window.addEventListener("pagehide", hide);
    return () => { window.clearTimeout(timer); window.removeEventListener("pagehide", hide); };
  }, [phone]);

  function show() {
    setMessage("");
    setBusy(false);
    setOpen(true);
  }

  function renderChallenge() {
    if (!container.current || !window.turnstile || widget.current !== null) return;
    widget.current = window.turnstile.render(container.current, {
      sitekey: siteKey, action: "reveal-phone", size: "compact", language: "ko",
      callback: async (token: string) => {
        if (active.current) return;
        const controller = new AbortController();
        active.current = controller;
        setBusy(true);
        setMessage("인증 결과를 확인하고 있습니다.");
        try {
          const response = await fetch("/api/contact-phone", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }), cache: "no-store", credentials: "omit",
            signal: controller.signal,
          });
          if (!response.ok) {
            setMessage(response.status === 429 ? "조회가 반복되어 제한됐습니다. 10분 후 다시 시도해 주세요." :
              response.status === 403 ? "사람 확인이 만료됐거나 실패했습니다. 창을 닫고 다시 시도해 주세요." :
              "전화번호를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.");
            return;
          }
          const value: unknown = await response.json();
          const verifiedPhone = value && typeof value === "object" ? (value as Record<string, unknown>).phone : undefined;
          if (typeof verifiedPhone !== "string" || !/^0\d{1,2}-\d{3,4}-\d{4}$/.test(verifiedPhone)) throw new Error("invalid");
          if (!controller.signal.aborted) {
            setPhone(verifiedPhone);
            setOpen(false);
            setMessage("");
          }
        } catch {
          if (!controller.signal.aborted) setMessage("연결을 확인한 뒤 창을 닫고 다시 시도해 주세요.");
        } finally {
          if (!controller.signal.aborted) setBusy(false);
          if (active.current === controller) active.current = null;
        }
      },
      "error-callback": () => setMessage("사람 확인을 불러오지 못했습니다. 창을 닫고 다시 시도해 주세요."),
      "expired-callback": () => setMessage("사람 확인이 만료됐습니다. 창을 닫고 다시 시도해 주세요."),
      "timeout-callback": () => setMessage("사람 확인 시간이 지났습니다. 창을 닫고 다시 시도해 주세요."),
    });
  }

  return (
    <span className={`phone-reveal phone-reveal--${variant}`}>
      {phone ? <>
        <a ref={phoneLink} className={buttonClass} href={`tel:${phone.replace(/-/g, "")}`}>전화 문의 {phone}</a>
        <button type="button" className="phone-hide" onClick={() => setPhone("")}>번호 숨기기</button>
      </> : <>
        <span className="phone-mask">010-****-****</span>
        <button ref={trigger} type="button" className={buttonClass} onClick={show}>전화번호 확인</button>
      </>}
      {open ? createPortal(
        <dialog ref={dialog} className="phone-dialog" aria-labelledby={headingId}
          onCancel={() => setOpen(false)} onClose={() => setOpen(false)}>
          <h2 id={headingId}>사람 확인 후 전화번호 안내</h2>
          <p>자동 수집을 줄이기 위해 Cloudflare Turnstile로 확인합니다. 확인 과정에서 IP 주소와 브라우저 정보가 Cloudflare에 전달됩니다.</p>
          <p><a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noreferrer">Cloudflare 개인정보 안내</a></p>
          {siteKey ? <>
            <div ref={container} className="phone-challenge" />
            <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
              onReady={renderChallenge} onError={() => setMessage("사람 확인을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.")} />
          </> : <p role="status">전화번호 확인 기능을 준비 중입니다. 잠시 후 다시 확인해 주세요.</p>}
          <p role="status" aria-live="polite" aria-busy={busy}>{message}</p>
          <button type="button" className="button" onClick={() => setOpen(false)}>닫기</button>
        </dialog>, document.body,
      ) : null}
    </span>
  );
}

