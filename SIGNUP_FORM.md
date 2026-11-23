# 회원가입·로그인·회원 관리

- 경로: `/signup` (하단 메뉴에서 접근)
- 현재 범위: Supabase Auth를 통한 실제 계정 생성·이메일 인증·로그인·로그아웃, 관리자 전용 회원 목록·검색·페이지 이동.
- 입력: 이름, 이메일, 비밀번호, 비밀번호 확인, 만 14세 이상 확인, 개인정보 수집·이용 및 국외 이전 개별 동의.
- 비밀번호는 12~128자이며 공백만으로 구성할 수 없다. 확인값과 정확히 일치해야 한다. 앞뒤 공백을 임의로 제거하지 않는다.
- 오류 항목 안내와 첫 오류로 초점 이동, 비밀번호 표시 전환을 제공한다.
- 비밀번호를 React 상태, URL, 로그, 브라우저 저장소에 보관하지 않는다. 인증정보는 Server Action의 POST 요청으로 Supabase Auth에 전달한다.
- 인증 세션은 HttpOnly 쿠키로 관리한다. 보호 페이지는 `getUser()`로 인증하고 DB 역할을 매번 확인한다. `user_metadata`를 관리자 권한 판정에 사용하지 않는다.
- 인증 관련 응답에는 캐시 금지와 `Referrer-Policy: no-referrer`를 적용한다. 공개 안내 페이지의 정적 렌더링은 유지한다.
- 설정은 `.env.example`을 참고한다. 실제 값은 무시되는 `.env.local` 또는 Vercel 환경변수에 저장하며, 이 기능에는 service_role/secret 키가 필요하지 않다.

## 경로와 권한

- `/signup`: 실제 가입 요청. `/login`: 이메일·비밀번호 로그인.
- `/auth/callback`: PKCE 코드 교환. `/auth/confirm`: 토큰 해시 기반 이메일 인증. 복귀 경로는 설정된 사이트의 `/account`로 고정하여 외부 리디렉션을 막는다.
- `/account`: 이메일 인증된 회원 본인의 계정.
- `/admin` 및 `/admin/members`: 비로그인 시 로그인으로 이동, 일반 회원은 권한 없음 안내. 관리자만 이름·이메일·가입일·인증 상태를 25명씩 검색·조회.
- DB의 `member_profiles`와 `member_administrators`에 RLS를 적용했다. 회원은 자신의 행만 읽고 직접 쓰거나 관리자 역할을 부여할 수 없다.
- `membership_private.administrator_invitations`는 비공개·권한 차단 테이블이다. 승인된 이메일의 인증 완료 시에만 한 번 관리자 역할을 부여한다. 초대 주소는 저장소에 포함하지 않는다.
- 보안 점검의 `rls_enabled_no_policy` 정보 알림은 이 비공개 초대 테이블의 의도적인 전면 차단 설정 때문이다. API 역할의 schema/table 권한도 없다. https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- 인증 프로필 동기화용 SECURITY DEFINER 트리거만 비공개 스키마에 둔다. 고정 search_path, 실행 권한 회수, Auth 트리거 출처 검사를 적용했다. Auth 가입 시 auth.uid()가 없으므로 이 트리거는 DB가 제공하는 NEW 행만 사용한다.

## 현재 운영 범위와 남은 설정

- 기존 `hyunju-edulab-test` 프로젝트를 사용한다. DB 위치는 인도 뭄바이이며, Vercel 인증 요청 서버는 미국 iad1이다. 두 경로를 `/privacy`와 가입 동의에 표시했다.
- 이메일 인증은 켜져 있고 익명 로그인은 꺼져 있다. 인증 서버의 최소 비밀번호 길이도 12자로 설정했다.
- 별도 SMTP가 없어서 Supabase 기본 인증 메일은 프로젝트 팀의 허용된 주소로 제한된다. 일반 방문자 공개 가입 전 custom SMTP 및 발신 도메인 인증이 필요하다. 이메일 인증을 끄는 방식으로 우회하지 않는다.
- 운영·개발 환경은 기존 테스트 프로젝트를 연결한다. Preview에는 인증 환경변수를 주입하지 않아 실수로 실제 가입을 받지 않는다.
- 관리자 초대 계정은 당사자가 직접 가입·메일 인증해야 한다. 계정 비밀번호를 대신 만들거나 이메일 인증을 임의로 완료하지 않는다.
- 이용 정지·권한 회수·탈퇴 삭제는 Supabase 관리 콘솔에서 처리한다. 삭제 전 세션을 해제하고 관리자 역할을 비활성화한다. 토큰 만료 전의 접근 가능성도 검토한다.
- 자동 탈퇴·회원 상태 변경 UI·자동 보유기간 파기는 이번 범위에 포함하지 않는다. 개인정보 정정·탈퇴 요청 연락처는 사이트에 안내한다.

## 검증 결과

- ESLint, 프로덕션 빌드, TypeScript 검사 통과.
- 입력·동의·검색·페이지 검증 테스트 12개 통과. `npm run verify`에 포함했다.
- `supabase/tests/membership_access.sql`: 일반 회원 격리, 미인증 관리자 초대 차단, 메타데이터 권한 위조 차단, 직접 쓰기 차단, 관리자 해제 후 접근 차단, 익명 접근 차단을 실제 DB에서 확인하고 롤백했다.
- 별도 승인을 받은 임시 회원·관리자 계정으로 `scripts/verify-membership.mjs`를 실행하여 실제 로그인·SSR 쿠키·계정 페이지·회원 목록·검색·비로그인 리디렉션·로그아웃을 확인했다. 시험 후 계정·프로필·관리자 권한·세션 잔여 0개를 확인했다.
- 임시 계정 자격정보는 저장소에 포함하지 않는다. 이 통합시험 스크립트는 승인된 시험 계정과 `.env.membership-test.local`이 준비된 때만 수동 실행한다.
- 실제 관리자 주소로의 메일 도착·인증 링크 클릭은 당사자가 가입한 뒤 확인해야 한다.

## 참고

- https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/privacy
- https://supabase.com/legal/customer-resources/data-processing-addendum
- https://vercel.com/legal/privacy-notice
