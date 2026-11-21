"use client";

import Image from "next/image";
import { type CSSProperties, useEffect, useRef } from "react";

import fieldSafetyBriefing from "./KakaoTalk_20261121_193716573.jpg";
import schoolWorkshop from "./KakaoTalk_20261121_193716573_01.jpg";
import workplaceSafetyLecture from "./KakaoTalk_20261121_193716573_02.jpg";
import instructorProfile from "./KakaoTalk_20261121_193716573_03.png";
import classroomScienceSafety from "./KakaoTalk_20261121_193716573_04.jpg";
import classroomDisasterLesson from "./KakaoTalk_20261121_193716573_05.jpg";
import kindergartenTrafficSafety from "./KakaoTalk_20261121_193716573_06.jpg";
import workplaceSafetySession from "./KakaoTalk_20261121_193716573_07.jpg";
import kindergartenFirstAid from "./KakaoTalk_20261121_193716573_08.jpg";
import kindergartenEmergencyTraining from "./KakaoTalk_20261121_193716573_09.jpg";
import kindergartenDisasterLesson from "./KakaoTalk_20261121_193716573_10.jpg";
import kindergartenSafetyActivity from "./KakaoTalk_20261121_193716573_11.jpg";
import kindergartenEvacuationLesson from "./KakaoTalk_20261121_193716573_12.jpg";
import fireEvacuationTraining from "./KakaoTalk_20261121_194645965.jpg";
import studentSafetyLecture from "./KakaoTalk_20261121_194645965_01.jpg";
import disasterSafetyAssembly from "./KakaoTalk_20261121_194645965_02.jpg";
import campusSafetyWorkshop from "./KakaoTalk_20261121_194645965_03.jpg";
import educationOperations from "./KakaoTalk_20261121_194645965_04.jpg";
import constructionSafetyClass from "./KakaoTalk_20261121_194645965_05.jpg";
import schoolSafetyAssembly from "./KakaoTalk_20261121_194645965_06.jpg";
import interactiveSafetyClass from "./KakaoTalk_20261121_194645965_07.jpg";
import fireSafetyQuiz from "./KakaoTalk_20261121_194645965_08.jpg";
import fireExtinguisherPractice from "./KakaoTalk_20261121_194645965_09.jpg";

const galleryImageSizes = {
  feature: "(min-width: 56rem) 58vw, (min-width: 36rem) 100vw, 100vw",
  wide: "(min-width: 56rem) 42vw, (min-width: 36rem) 100vw, 100vw",
  profile: "(min-width: 56rem) 34vw, (min-width: 36rem) 50vw, 100vw",
  standard: "(min-width: 56rem) 34vw, (min-width: 36rem) 50vw, 100vw",
} as const;

const galleryItems = [
  {
    image: fieldSafetyBriefing,
    alt: "산업 현장에서 참여자들이 안전교육 화면을 함께 보고 있는 모습",
    category: "INDUSTRIAL SAFETY",
    title: "현장에서 시작하는 안전교육",
    layout: "feature",
  },
  {
    image: schoolWorkshop,
    alt: "학생들이 교실에서 안전교육 강의를 듣고 있는 모습",
    category: "SCHOOL SAFETY",
    title: "질문과 참여로 이어지는 수업",
    layout: "wide",
  },
  {
    image: workplaceSafetyLecture,
    alt: "성인 학습자들이 교실에서 산업안전 강의를 듣고 있는 모습",
    category: "FIELD LEARNING",
    title: "실무 사례를 나누는 시간",
    layout: "wide",
  },
  {
    image: instructorProfile,
    alt: "최현주 강사의 안전교육과 AI 교육 분야를 소개한 안내 이미지",
    category: "HYUNJU EDU LAB",
    title: "안전교육과 AI를 연결하는 전문가",
    layout: "profile",
  },
  {
    image: classroomScienceSafety,
    alt: "교실에서 교사가 학생들에게 과학 체험 안전수칙을 설명하는 모습",
    category: "SCHOOL SAFETY",
    title: "체험 전, 함께 익히는 안전수칙",
    layout: "standard",
  },
  {
    image: classroomDisasterLesson,
    alt: "교실의 대형 화면으로 재난안전 사례를 살펴보는 학생들",
    category: "DISASTER EDUCATION",
    title: "사례로 이해하는 재난안전",
    layout: "standard",
  },
  {
    image: kindergartenTrafficSafety,
    alt: "유아들이 교실에서 교통안전 교육을 듣고 있는 모습",
    category: "EARLY CHILDHOOD",
    title: "눈높이에 맞춘 교통안전",
    layout: "standard",
  },
  {
    image: workplaceSafetySession,
    alt: "산업안전 교육에 참여한 학습자들이 강의를 듣고 있는 모습",
    category: "INDUSTRIAL SAFETY",
    title: "산업 현장에 필요한 기본 안전",
    layout: "standard",
  },
  {
    image: kindergartenFirstAid,
    alt: "유아와 보호자가 강당에서 응급처치 체험에 참여하는 모습",
    category: "FIRST AID",
    title: "직접 해보며 익히는 응급처치",
    layout: "feature",
  },
  {
    image: kindergartenEmergencyTraining,
    alt: "강당 스크린에 응급처치 교육 화면이 비치고 있는 모습",
    category: "FIRST AID",
    title: "가족과 함께하는 안전 체험",
    layout: "standard",
  },
  {
    image: kindergartenDisasterLesson,
    alt: "무대의 화면으로 어린이 재난대피 교육을 진행하는 모습",
    category: "DISASTER EDUCATION",
    title: "어린이 재난대피교육",
    layout: "wide",
  },
  {
    image: kindergartenSafetyActivity,
    alt: "안전 체험을 마친 유아들이 교실 밖으로 이동하는 모습",
    category: "SAFETY EXPERIENCE",
    title: "배움 뒤에도 이어지는 안전 습관",
    layout: "standard",
  },
  {
    image: kindergartenEvacuationLesson,
    alt: "유아들이 무대 앞에 앉아 재난대피교육을 듣고 있는 모습",
    category: "EARLY CHILDHOOD",
    title: "함께 배우는 대피의 약속",
    layout: "standard",
  },
  {
    image: fireEvacuationTraining,
    alt: "유아들이 강당에서 화재대피 훈련 안내를 듣고 있는 모습",
    category: "FIRE SAFETY",
    title: "화재 상황을 대비하는 대피 훈련",
    layout: "feature",
  },
  {
    image: studentSafetyLecture,
    alt: "학생들이 강의실에서 안전보건 교육을 듣고 있는 모습",
    category: "SCHOOL SAFETY",
    title: "청소년과 함께 나누는 안전보건",
    layout: "wide",
  },
  {
    image: disasterSafetyAssembly,
    alt: "학생들이 체육관 강당에서 재난안전 교육에 참여하고 있는 모습",
    category: "DISASTER EDUCATION",
    title: "모두가 참여하는 재난안전 수업",
    layout: "feature",
  },
  {
    image: campusSafetyWorkshop,
    alt: "학습자들이 교실에서 안전교육 강의를 듣고 있는 모습",
    category: "SAFETY CAMPUS",
    title: "일상의 공간에서 배우는 안전",
    layout: "standard",
  },
  {
    image: educationOperations,
    alt: "교육 운영 장비를 준비하며 수업을 지원하는 모습",
    category: "EDUCATION SUPPORT",
    title: "교육의 몰입을 만드는 꼼꼼한 준비",
    layout: "standard",
  },
  {
    image: constructionSafetyClass,
    alt: "안전모를 쓴 현장 근로자들이 산업안전 교육을 듣고 있는 모습",
    category: "INDUSTRIAL SAFETY",
    title: "현장 근로자를 위한 산업안전교육",
    layout: "wide",
  },
  {
    image: schoolSafetyAssembly,
    alt: "학생들이 강당에서 대규모 안전교육에 참여하고 있는 모습",
    category: "SCHOOL SAFETY",
    title: "강당에서 함께 익히는 안전의 기준",
    layout: "wide",
  },
  {
    image: interactiveSafetyClass,
    alt: "교실에서 강사가 학생들과 함께 안전 퀴즈 활동을 진행하는 모습",
    category: "INTERACTIVE CLASS",
    title: "몸으로 기억하는 안전 퀴즈",
    layout: "standard",
  },
  {
    image: fireSafetyQuiz,
    alt: "강당 무대에서 화재안전 퀴즈를 진행하는 모습",
    category: "FIRE SAFETY",
    title: "퀴즈로 되짚어 보는 화재안전",
    layout: "feature",
  },
  {
    image: fireExtinguisherPractice,
    alt: "운동장에서 학생들이 소화기 사용 훈련을 지켜보는 모습",
    category: "FIRE DRILL",
    title: "직접 체험하는 소화기 사용법",
    layout: "feature",
  },
] as const;

export default function FieldGallery() {
  const galleryRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery || !("IntersectionObserver" in window)) return;

    const cards = Array.from(gallery.querySelectorAll<HTMLElement>("[data-gallery-card]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8%", threshold: 0.12 },
    );

    cards.forEach((card) => observer.observe(card));
    gallery.classList.add("is-ready");

    return () => observer.disconnect();
  }, []);

  return (
    <section className="field-gallery about-section" aria-labelledby="field-gallery-title">
      <div className="field-gallery-heading">
        <div>
          <p className="eyebrow">FIELD NOTES</p>
          <h2 id="field-gallery-title">배움이 실제가 되는 교육 현장</h2>
        </div>
        <p>
          산업 현장부터 학교와 유아교육기관까지, 대상의 일상에 맞춰 안전을 함께 보고,
          듣고, 직접 해보는 시간을 만듭니다.
        </p>
      </div>
      <ul ref={galleryRef} className="field-gallery-grid">
        {galleryItems.map(({ image, alt, category, title, layout }, index) => (
          <li
            className={`field-gallery-card field-gallery-card--${layout}`}
            data-gallery-card
            key={title}
            style={{ "--gallery-delay": `${(index % 4) * 70}ms` } as CSSProperties}
          >
            <figure>
              <Image src={image} alt={alt} fill sizes={galleryImageSizes[layout]} />
              <figcaption>
                <p>{category}</p>
                <h3>{title}</h3>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
