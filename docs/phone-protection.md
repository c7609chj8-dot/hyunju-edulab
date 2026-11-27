# 전화번호 보호 설정 및 검증

## 이번 변경
- 홈·문의·개인정보 처리방침·회원 페이지의 운영자 번호를 보호 컴포넌트로 통일.
- 기본 HTML·RSC·JS에는 일반 마스크만 표시. 실제 번호는 서버 전용 CONTACT_PHONE_NUMBER로만 설정.
- 방문자가 버튼을 눌렀을 때만 Turnstile 로드. 서버 Siteverify 성공, 현재 도메인, reveal-phone 용도, 발급 시각을 검증한 뒤 POST 응답으로 표시.
- 표시한 값은 브라우저 저장소·쿠키에 보관하지 않고 5분 또는 pagehide 때 제거. 인증 후에만 tel 링크 생성.
- API 응답은 no-store, CDN no-store, noindex. 인증 토큰·IP·전화번호를 앱 로그에 기록하지 않음.
- 인증 설정, Vercel 제한 규칙 또는 서비스가 없으면 실패로 처리하고 번호를 반환하지 않음.

## 무료 도구와 필요한 설정
Cloudflare Turnstile Free와 기존 Vercel Hobby의 무료 제한 범위를 우선 사용한다. 유료 플랜, Redis, 새 DB는 만들지 않는다.
현재 요금은 공식 문서를 다시 확인하고, 업그레이드/결제 화면이 나타나면 진행하지 않는다.

1. Cloudflare 대시보드에서 Turnstile Free 위젯을 만든다.
   - Managed 방식, 도메인 hyunjulab.com만 허용.
   - 테스트와 Preview는 별도 위젯과 정확한 호스트명을 사용한다. 모든 vercel.app 호스트를 포괄적으로 허용하지 않는다.
   - site key는 공개값이고 secret key는 서버 비밀값이다. 키를 채팅·GitHub·스크린샷에 올리지 않는다.
2. Vercel 기존 프로젝트 hyunju-edulab의 해당 환경에만 다음을 저장한다.
   - CONTACT_PHONE_NUMBER: 실제 연락처. Secret 유형. NEXT_PUBLIC_ 사용 금지.
   - TURNSTILE_SECRET_KEY: 실제 위젯 secret. Secret 유형.
   - NEXT_PUBLIC_TURNSTILE_SITE_KEY: 같은 위젯의 공개 site key.
   - PHONE_REVEAL_ALLOWED_HOSTS: hyunjulab.com. Preview는 별도 정확한 호스트를 지정.
   - PHONE_REVEAL_ENABLED: 규칙과 인증 준비 전 false. 준비 후 true.
3. Vercel Firewall에서 기존 규칙과 무료 한도 사용 여부를 확인한다.
   - Hobby의 rate-limit 규칙은 프로젝트당 1개이므로 기존 규칙을 덮어쓰지 않는다.
   - SDK 조건 @vercel/firewall / rate_limit_api_id = edulab-phone-reveal.
   - IP 기준 600초 동안 5회, 초과 시 제한. 이 ID 외 사이트 페이지나 인증 API를 광범위하게 차단하지 않는다.
   - 방화벽 설정은 초안 검토, 로그 단계 검토, Preview 검증, 운영 적용 순서로 진행한다.
   - 실제 Publish는 사용자가 직접 수행한다. 이 저장소의 코드는 방화벽 설정을 게시하지 않는다.
   - 규칙이 없거나 SDK 오류가 있으면 API가 503을 반환하는 것이 정상이다.
4. 키와 제한 규칙 준비 후 PHONE_REVEAL_ENABLED=true로 바꾸고 재배포한다.
5. 운영 반영 전 Preview 검증을 완료하고 main 병합·운영 배포 승인을 받는다.

## 검증 명령
- npm run verify
- CONTACT_PHONE_NUMBER를 실제 값으로 안전하게 주입한 환경에서 node scripts/check-phone-exposure.mjs
  - 기본값은 Git 추적 현재 파일과 .next/static JS, 프리렌더 HTML·RSC를 검사한다.
  - 비교 문자열이나 실제 번호를 결과에 출력하지 않는다.
- 운영/Preview HTML과 RSC 응답에 실제 번호와 직접 tel 링크가 없는지 확인한다.
- 인증 없는 POST·직접 GET·Origin 변조·잘못된 JSON·만료/재사용 토큰 요청은 번호를 반환하면 안 된다.
- 실제 Turnstile 인증 후 표시/전화 링크를 확인한다. 검증 중 실제 전화는 걸지 않는다.
- 같은 IP에서 제한 횟수 초과 시 429, Retry-After와 UI 안내가 나오는지 확인한다.
- 인증 후 응답 및 모든 실패 응답의 Cache-Control:no-store를 확인한다.
- 홈·문의·개인정보 안내의 모바일 기본 화면, 모달 닫기, 키보드 포커스·Escape, 기존 회원/관리자 테스트를 확인한다.
- Cloudflare/방화벽 장애·스크립트 차단 때는 번호를 노출하지 않는지 확인한다.

## 한계와 과거 노출
- 확인을 통과한 사람은 표시된 번호를 복사·기록할 수 있다. 악성 자동화의 완전 차단을 보장하지 않는다.
- Turnstile 재사용 방지는 제공자의 전파 지연이 있을 수 있다. 새 인증을 받은 이용자의 정상 접근도 IP 공유로 제한될 수 있다.
- 이전 main 커밋, PR 변경 이력, 기존 Preview 배포, 검색엔진 캐시에 이미 공개된 번호가 남을 수 있다.
- 이번 변경은 새 코드·새 빌드의 노출을 막는다. 과거 공개값을 소급하여 회수하지 않는다.
- Git 이력 재작성·강제 push·과거 배포 삭제·검색 캐시 제거는 별도 승인 없이 하지 않는다. 공개 이력이 부담되면 연락처 변경도 검토한다.
- 미병합된 기존 PR을 뒤늦게 적용하면 직접 번호 노출 또는 삭제된 site-contact import가 재도입될 수 있다. 병합 전 노출 검사를 다시 수행한다.
- 개인정보 처리방침의 운영자 연락 경로도 동일하게 보호되므로 실제 인증 성공과 접근성 검증 전 공개 배포하지 않는다.

## 참고
- https://developers.cloudflare.com/turnstile/plans/
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting-sdk
- https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting

