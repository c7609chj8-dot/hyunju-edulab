# hyunjulab.com 검색 노출 준비

## 적용 범위
- 대표주소: https://hyunjulab.com (www 주소는 별도 설정 전 사용하지 않음).
- 홈, 강사 소개, 프로그램 목록과 4개 교육 상세 페이지의 제목·설명 및 공개 본문 개선.
- 모든 기존 pageMetadata 호출, 사이트맵, 공유 이미지 및 문의 QR 주소에 새 도메인 사용.
- WebSite, Person, 교육 상세 BreadcrumbList 구조화 데이터. 평점·가격·지역·인증기관 정보를 임의로 추가하지 않음.
- 관리자·회원·문의 화면 검색 제외. Preview/개발 환경은 기존 noindex 및 robots 전체 차단 정책 유지.
- 기존 DB, 인증 기능, 브랜드, 운영 환경변수와 main 브랜치는 이 작업으로 변경하지 않음.

## 배포 승인 후 순서
1. SEO 브랜치 변경을 검토하고 main 병합 및 운영 배포를 승인한다.
2. 운영 배포 후 홈페이지 HTML의 canonical이 https://hyunjulab.com/이고 robots가 index인지 확인한다.
3. https://hyunjulab.com/robots.txt 와 https://hyunjulab.com/sitemap.xml 을 확인한다. 사이트맵에는 공개 콘텐츠만 있어야 한다.
4. 구글 Search Console에 hyunjulab.com 도메인 속성을 등록한다. 도메인 속성은 DNS TXT로 소유권을 확인한다. 또는 URL 접두어 속성 https://hyunjulab.com/ 을 등록하고 HTML 태그 방식을 선택한다.
5. HTML 태그 방식이면 구글 태그의 content 값만 Vercel Production 환경변수 GOOGLE_SITE_VERIFICATION에 입력한다. DNS 방식은 이 환경변수가 필요 없다.
6. 네이버 서치어드바이저에 https://hyunjulab.com 을 등록하고 HTML 태그 content 값만 NAVER_SITE_VERIFICATION에 입력한다.
7. 환경변수 추가 후 운영 재배포한다. 두 도구에서 소유확인을 완료한다.
8. 두 도구에 https://hyunjulab.com/sitemap.xml 을 제출한다. 홈과 교육 상세 URL의 수집/색인 상태를 확인한다.
9. 검색어별 노출·클릭·색인 제외 사유를 확인하며 실제 교육 자료와 사례를 보강한다.

## 주의사항
- 검색엔진에 키워드 목록을 등록하면 순위가 오르는 방식은 아니다. 제목·본문·내부 링크·실제 콘텐츠가 주제를 설명해야 한다. Google은 meta keywords를 검색 순위에 사용하지 않으므로 추가하지 않았다.
- 소유확인 값은 발급 전 비워 둔다. 전체 meta 태그나 예시 토큰을 환경변수 값에 넣지 않는다.
- 미리보기 배포의 noindex는 정상이다. 검증 토큰 역시 빌드 시 메타데이터에 반영되므로 운영 재배포가 필요하다.
- 소유확인, 사이트맵 제출, 색인 요청은 검색 결과 노출이나 상위 순위를 보장하지 않는다.
- 문의 폼은 기존 안내대로 접수 기능 준비 중이다. 실제 접수나 응답시간을 보장하는 문구를 추가하지 않았다.
- 기존 코드의 브랜드는 현주에듀랩이다. SAFEMIND로 변경하는 작업은 포함하지 않았다.

## 검증
- node --test tests/seo.test.mjs
- 전체 저장소에서 npm run verify (설치된 의존성 필요).
- 운영 승인 전 Preview 빌드에서 Next.js 컴파일·타입 검사를 확인한다.
- 운영 배포 후 홈·소개·4개 교육 페이지에서 고유 title/description/canonical과 JSON-LD를 확인한다.
- 관리자·회원 화면은 로그인 없이 데이터가 보이지 않고 noindex여야 한다.

## 참고 문서
- [Google 메타 태그](https://developers.google.com/search/docs/crawling-indexing/special-tags)
- [Google 사이트 이름](https://developers.google.com/search/docs/appearance/site-names)
- [Google 사이트맵](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Next.js Metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Next.js JSON-LD](https://nextjs.org/docs/app/guides/json-ld)
- [네이버 검색 등록 안내](https://searchadvisor.naver.com/guide/faq-start-register)
