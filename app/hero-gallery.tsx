"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const photos = [
  { src: "/images/school-safety-class.jpg", title: "함께 배우는 학교안전", alt: "교실에서 학생들과 함께 진행하는 안전교육 현장", detail: "현장의 상황을 살펴보고 안전한 행동을 익히는 시간" },
  { src: "/images/ai-workshop.jpg", title: "직접 익히는 AI 활용", alt: "참여자들이 노트북으로 실습하는 AI 활용교육 현장", detail: "직접 실습하며 수업과 업무에 적용하는 배움" },
];

function subscribeMotion(change: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", change);
  return () => media.removeEventListener("change", change);
}

export default function HeroGallery() {
  const [active, setActive] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(true);
  const gallery = useRef<HTMLDivElement>(null);
  const reducedMotion = useSyncExternalStore(subscribeMotion, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => true);
  const playing = autoplay && !reducedMotion && !hovered && !focused && inView;

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: .2 });
    if (gallery.current) observer.observe(gallery.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") setActive((index) => (index + 1) % photos.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [playing]);

  function select(index: number) {
    setAutoplay(false);
    setActive((index + photos.length) % photos.length);
  }

  return (
    <div
      ref={gallery}
      className="hero-gallery"
      role="region"
      aria-roledescription="사진 슬라이드"
      aria-label="교육 현장 사진"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          select(active + (event.key === "ArrowLeft" ? -1 : 1));
        }
      }}
    >
      <div className="hero-gallery-stage">
        {photos.map((photo, index) => (
          <div className="hero-gallery-slide" data-active={active === index} aria-hidden={active !== index} key={photo.src}>
            <Image className="hero-gallery-ambient" src={photo.src} alt="" aria-hidden="true" fill sizes="100vw" />
            <Image className="hero-gallery-photo" src={photo.src} alt={photo.alt} fill sizes="100vw" preload={index === 0} />
          </div>
        ))}
        <span className="hero-gallery-label" aria-hidden="true">FIELD NOTES / HYUNJU EDU LAB</span>
      </div>
      <div className="hero-gallery-footer">
        <div className="hero-gallery-caption" aria-live={playing ? "off" : "polite"} aria-atomic="true">
          <p className="hero-gallery-number">{String(active + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}</p>
          <h2>{photos[active].title}</h2>
          <p>{photos[active].detail}</p>
        </div>
        <div className="hero-gallery-controls" aria-label="사진 전환">
          <button type="button" aria-label="이전 사진" onClick={() => select(active - 1)}>이전</button>
          <button type="button" aria-label={autoplay && !reducedMotion ? "사진 자동 전환 멈추기" : "사진 자동 전환 시작하기"} disabled={reducedMotion} onClick={() => setAutoplay((value) => !value)}>{reducedMotion ? "수동 전환" : autoplay ? "일시정지" : "자동 재생"}</button>
          <button type="button" aria-label="다음 사진" onClick={() => select(active + 1)}>다음</button>
        </div>
      </div>
      <div className="hero-gallery-tabs" aria-label="사진 선택">
        {photos.map((photo, index) => <button type="button" key={photo.src} aria-label={`${photo.title} 사진 보기`} aria-pressed={active === index} onClick={() => select(index)}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{photo.title}</button>)}
      </div>
    </div>
  );
}
