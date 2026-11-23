# 회원가입·로그인·관리자 계정 관리

## 현재 연결

- Supabase: ai-education-hub-dev (`uenvjqgylrevujdjpfed`), 일본 도쿄.
- 기존 hyunju-edulab-test는 더 이상 이 홈페이지의 연결 대상으로 사용하지 않는다.
- 실제 환경값은 무시되는 .env.local 및 기존 Vercel 프로젝트의 환경변수에 저장한다. 비밀키는 저장소에 포함하지 않으며 이 기능에는 service_role 키를 사용하지 않는다.
- 공유 프로젝트에 원래 있던 Auth 계정과 교육 스키마는 유지한다. 승인된 기존 관리자만 홈페이지 프로필과 역할을 연결했다. 기존 가입에 새 개인정보 동의 시각을 임의로 기록하지 않는다.

## 가입과 로그인

- /signup: 이름·이메일·비밀번호·확인값 및 개인정보·국외 이전 동의.
- 회원 아이디·주소·전화번호는 선택 입력으로 받고 DB 프로필에 저장한다. 회원 아이디는 관리용이며 로그인은 이메일을 사용한다.
- /login: 회원 로그인. /account: 본인 정보와 로그아웃.
- /auth/callback: PKCE 코드 교환. /auth/confirm: 이메일 토큰 해시 검증.
- 이메일 인증을 유지한다. 별도 SMTP가 없으면 인증 메일 수신은 Supabase 프로젝트 팀 주소로 제한되므로, 일반 방문자 가입 개방 전 SMTP와 발신 도메인을 설정해야 한다.
- 회원 프로필이 없거나 이용 정지 상태이면 이 홈페이지 로그인·보호 페이지 이용을 차단한다.
- 비밀번호 원문은 관리 화면이나 회원 테이블에 저장하지 않는다. 세션은 HttpOnly 쿠키로 관리하며 서버에서 getUser()로 검증한다.

## 관리자

- /admin/login: 별도 관리자 로그인.
- /admin: 회원 현황 대시보드.
- /admin/members: 이름·회원 아이디·이메일 검색과 페이지 이동.
- /admin/members/[id]: 이름·회원 아이디·주소·전화번호 수정, 홈페이지 이용 정지·복구, 변경 이력.
- 레이아웃·각 데이터 조회 페이지·저장 Server Action에서 관리자 권한을 검사한다. DB RLS도 적용한다.
- 상태 변경은 이 홈페이지에만 적용한다. 공유 프로젝트의 다른 앱 Auth 계정을 정지하거나 삭제하지 않는다.
- 활성 관리자 계정의 정지는 DB에서도 차단한다. 관리자 역할 부여·회수 및 실제 Auth 계정 삭제는 Supabase 콘솔에서 별도로 처리한다.
- revision 검사로 동시에 수정한 내용을 덮어쓰지 않는다. 변경 항목명·상태·작업자 ID·시각만 감사 기록에 남기며 주소·전화번호 원문은 복제하지 않는다.
- 상세 구현은 app/admin/README.md 참고.

## 개인정보와 보안

- 동의 버전: 2026-11-23.2. Supabase 일본 저장과 Vercel 미국 인증 요청 처리를 /privacy에서 안내한다.
- 일반 회원은 자신의 회원 정보만 읽을 수 있고, 관리자만 전체 조회·정해진 컬럼 수정이 가능하다.
- 관리자 판정은 사용자가 수정할 수 있는 user_metadata를 사용하지 않는다.
- 비공개 스키마의 제한된 DB 함수는 고정 search_path와 실행 권한 제한, auth.uid() 검사를 적용한다.
- Auth 동기화 트리거는 이 앱으로 표시된 신규 가입에만 프로필을 만들고 타 앱의 가입은 그대로 처리한다.
- 보안 점검의 비공개 테이블 RLS 정책 없음 정보 알림은 API 권한을 주지 않은 전면 차단 설정이다. 기존 교육 스키마의 같은 알림도 이번 작업 범위 밖이다.
- 프로젝트의 유출 비밀번호 차단 옵션 미설정 경고는 추가 설정 대상으로 남아 있다. https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## 검증과 운영

- npm run verify: 단위 테스트·lint·빌드·타입 검사.
- supabase/tests/admin_management.sql: 실제 DB 권한·수정·감사·revision 충돌·정지/복구·관리자 보호·권한 회수·익명 차단 검증. 시험 데이터는 전체 롤백한다.
- 신규 가입 메타데이터의 아이디·주소·전화번호·동의 기록 저장도 DB 트리거로 검증 후 롤백했다.
- 기존 관리자 본인의 실제 비밀번호 입력과 인증 메일 확인은 당사자가 수행한다.
- scripts/verify-membership.mjs는 명시적으로 승인된 임시 계정이 준비됐을 때만 수동 실행한다. 이번 프로젝트에는 지속적인 시험 계정을 만들지 않았다.

## 출처

- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- https://supabase.com/privacy
- https://vercel.com/legal/privacy-notice
