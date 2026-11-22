# Supabase 백엔드 1단계 — 테스트 환경 구축 기준

## 이 문서의 상태

이 구현은 `codex/backend-phase1-supabase` 브랜치에서만 준비했다. 운영 `main`, 운영 Supabase 프로젝트, 운영 사이트와 Preview 배포는 건드리지 않았다.

문의 공개 접수는 계속 비활성이다.

```env
INQUIRY_API_ENABLED=false
INQUIRY_NOTIFICATION_ENABLED=false
```

`INQUIRY_API_ENABLED`를 `true`로 바꾸거나, 운영 DB에 마이그레이션을 적용하거나, 접근 제한 없는 Preview를 배포하면 안 된다. 이 단계의 테스트는 DB 스키마, 관리자 인증·권한, 합성 데이터 조회와 상태 변경만 확인한다.

## 구현한 범위

- `supabase/migrations/20261122011730_phase1_inquiries.sql`
  - 문의, 처리 이력, 관리자 역할, 감사 이력 테이블
  - 문의 분야: `safety`(안전교육), `ai`(AI교육), `lecture`(강의 의뢰), `collaboration`(협업)
  - 상태: `received`(접수) → `reviewing`(확인 중) → `answered`(답변 완료)
  - 접수 원자 저장, 중복 제출 재응답, 다른 본문으로 같은 키 재사용 시 충돌 처리
  - 모든 개인정보 테이블 RLS 활성화 및 `anon`·`authenticated` 역할의 직접 테이블 접근 차단
  - 서버 비밀키 역할만 호출할 수 있는 저장·상태 변경 함수
- `POST /api/inquiries`
  - 기본값이 `false`인 공개 접수 차단을 유지한다.
  - 활성화 전에도 코드상 입력 검증, 크기 제한, 허니팟, instance-local 요청 제한, Idempotency-Key 해시·요청 지문, DB 저장 경로를 갖춘다.
- `/admin/login`, `/admin/inquiries`, `PATCH /api/admin/inquiries/:id`
  - Supabase Auth의 로그인 세션을 서버에서 다시 확인한다.
  - `administrator_roles`의 활성 대표 계정 1개만 조회·상태 변경을 할 수 있다.
  - 상태 변경은 버전 충돌 검사와 이벤트·감사 이력을 하나의 DB 함수에서 처리한다.
- `supabase/tests/phase1_inquiries_test.sql`
  - 실제 개인정보가 없는 pgTAP 합성 데이터 테스트다.
- 현재 문의 화면
  - 분야, 이름, 연락처, 선택 이메일, 개인정보 동의 필드를 새 기준에 맞췄다.
  - 입력 확인용 화면이며 저장하거나 전송하지 않는다.

## 데이터 흐름과 비밀키 경계

```text
공개 문의 화면 ──(현재 저장하지 않음)──> POST /api/inquiries
                                           └─ false이면 503으로 종료

관리자 브라우저 ── 공개 URL·Publishable Key로 Auth 로그인
       │
       └─ 관리자 페이지/Route Handler ── 서버에서 getUser() 검증
                                            └─ 활성 대표 역할 확인
                                                 └─ 서버의 Secret Key로만 DB 조회·RPC
```

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`는 브라우저에 있어도 되는 값이다.
- `SUPABASE_SECRET_KEY`는 서버 전용이다. `NEXT_PUBLIC_` 접두사를 붙이지 않고, 클라이언트 코드·GitHub·스크린샷·문의 데이터에 넣지 않는다.
- 브라우저의 `anon` 또는 일반 `authenticated` 역할은 문의 테이블을 읽거나 쓰지 못한다. 관리자 화면도 브라우저에서 DB를 직접 조회하지 않는다.

## 사용자가 직접 할 Supabase 테스트 설정

아래 단계는 **새 테스트 프로젝트**에서만 한다. 기존 운영 프로젝트를 열었거나 이름이 확실하지 않으면 중단한다.

### 1. 테스트 프로젝트 만들기

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인한다.
2. **New project**를 누른다.
3. 운영과 구분되는 이름(예: `hyunju-edulab-inquiry-test`)을 입력한다.
4. 운영과 다른 프로젝트인지 이름과 조직을 다시 확인한다.
5. DB 비밀번호는 비밀번호 관리 도구에만 보관하고, 저장소·메신저·스크린샷에 남기지 않는다.
6. Free 플랜과 가까운 리전을 선택하고 **Create new project**를 누른다.

### 2. 키를 로컬 환경에만 입력하기

프로젝트가 준비되면 왼쪽 아래 **Project Settings**(톱니바퀴) → **API Keys**를 연다. 현재 Dashboard에서는 키 이름이 **Publishable**과 **Secret**으로 표시될 수 있다.

1. **Project URL**을 복사한다.
2. **Publishable key**를 복사한다.
3. **Secret key**는 필요할 때만 복사하고, 복사 후 붙여넣기 기록을 지운다.
4. 프로젝트 루트에만 `.env.local` 파일을 만들고 아래처럼 입력한다. `.env.local`은 이미 Git에서 제외된다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SECRET_KEY=your_secret_key

# 운영 기준 확정 전 테스트용 임시값 예시입니다.
PRIVACY_POLICY_VERSION=temporary-test-v1
INQUIRY_RETENTION_DAYS=30

# 이 단계에서는 반드시 false를 유지합니다.
INQUIRY_API_ENABLED=false
INQUIRY_NOTIFICATION_ENABLED=false
```

`SUPABASE_SECRET_KEY`는 Vercel 환경변수에 추가할 때도 **Production이 아닌 접근 제한된 테스트 환경**에만 입력한다. 현재는 Preview 배포를 하지 않는다. 나중에 보호된 테스트 Preview를 만들 때는 Vercel **Project Settings** → **Environment Variables** → **Add**에서 URL·Publishable key는 `Config`, `SUPABASE_SECRET_KEY`는 `Secret`으로 지정하고, Preview의 이 기능 브랜치에만 범위를 제한한다.

### 3. 테스트 DB에만 마이그레이션 적용하기

가장 안전한 방법은 CLI로 테스트 프로젝트를 연결한 뒤 마이그레이션을 적용하는 것이다. 아래 명령은 테스트 프로젝트가 맞는지 확인한 뒤에만 실행한다.

```powershell
npx supabase login
npx supabase link --project-ref <테스트_프로젝트_Ref>
npx supabase db push
```

프로젝트 Ref는 Dashboard의 **Project Settings** → **General**에서 확인할 수 있다. `db push` 전 대상이 테스트 프로젝트인지 다시 확인한다.

CLI 대신 Dashboard로 진행해야 한다면 **SQL Editor** → **New query**에서 [`supabase/migrations/20261122011730_phase1_inquiries.sql`](supabase/migrations/20261122011730_phase1_inquiries.sql)의 전체 내용을 테스트 프로젝트에만 붙여 넣고 **Run**을 누른다. 실행 후 **Table Editor**에서 다음 네 테이블을 확인한다.

- `administrator_roles`
- `inquiries`
- `inquiry_events`
- `administrator_audit_logs`

### 4. 공개 회원가입을 끄고 대표 계정 1개 만들기

Dashboard 메뉴 명칭은 조금 달라질 수 있으나, 다음 항목을 찾는다.

1. **Authentication** → **Settings** 또는 **General Configuration**을 연다.
2. **Allow new users to sign up**을 끈다.
3. **Anonymous sign-ins**도 꺼져 있는지 확인한다.
4. **Authentication** → **Users** → **Add user**를 누른다.
5. 지정된 대표 이메일 한 개에만 **Send invitation** 또는 **Create user**를 사용한다.
6. 대표가 초대를 수락한 뒤, **Authentication** → **Users**에서 해당 사용자의 UUID를 복사한다.
7. **SQL Editor** → **New query**에서 아래 SQL의 UUID만 바꾸고 실행한다.

```sql
insert into public.administrator_roles (auth_user_id, role, is_active)
values ('대표_계정_UUID', 'administrator', true);
```

이 스키마는 활성 `administrator`를 1개만 허용한다. 대표 계정을 바꾸려면 기존 계정을 먼저 비활성으로 바꾼 뒤 새 계정을 등록해야 한다.

```sql
update public.administrator_roles
set is_active = false, revoked_at = now()
where auth_user_id = '기존_대표_UUID';
```

Supabase의 초대 이메일은 관리자 인증을 위한 것이며, 이번 단계에서 제외한 문의 자동 알림 이메일과는 별개다.

## 합성 데이터 검증 순서

### 로컬 DB 자동 검사

Docker Desktop이 준비된 개발 PC에서만 실행한다. 이 명령은 로컬 Docker의 테스트 DB를 초기화하므로 운영 DB와 연결하지 않는다.

```powershell
npx supabase start
npx supabase db reset
npx supabase test db
```

`supabase/tests/phase1_inquiries_test.sql`은 다음을 검사한다.

- 테이블과 RLS 생성 여부
- 익명·일반 로그인 역할의 직접 조회 차단
- 합성 문의 저장 및 제출 이벤트 생성
- 같은 중복 방지 키·같은 요청의 재응답
- 같은 키·다른 요청의 충돌
- 대표 역할이 없는 사용자의 상태 변경 차단

### 호스팅된 테스트 프로젝트 수동 검사

대표 계정 설정 후, 테스트 프로젝트의 **SQL Editor**에서만 아래 합성 데이터를 만든다. 실제 이름·전화번호·이메일을 쓰지 않는다.

```sql
select *
from public.create_inquiry(
  '44444444-4444-4444-8444-444444444444',
  'HJ-TESTTESTTEST',
  repeat('d', 64),
  repeat('e', 64),
  'school-safety',
  'safety'::public.inquiry_category,
  '테스트 담당자',
  '010-0000-0000',
  'tester@example.test',
  '합성 데이터로 관리자 조회와 상태 변경을 확인합니다.',
  'temporary-test-v1',
  now(),
  now() + interval '30 days',
  now()
);
```

그 다음 로컬에서 `npm run dev`를 실행하고 대표 계정으로 `/admin/login`에 로그인한다.

1. `/admin/inquiries`에서 `HJ-TESTTESTTEST`가 보이는지 확인한다.
2. 상태를 **접수 → 확인 중 → 답변 완료** 순서로 바꾼다.
3. 대표 역할이 없는 임시 계정으로는 같은 화면에 접근할 수 없는지 확인한다.
4. `POST /api/inquiries`는 어떤 입력에도 503을 반환하는지 확인한다. 이것이 이번 단계의 의도된 보호 동작이다.

테스트를 마친 뒤에는 테스트 프로젝트에서 아래 SQL로 합성 데이터를 지운다.

```sql
delete from public.administrator_audit_logs
where target_id = '44444444-4444-4444-8444-444444444444';

delete from public.inquiry_events
where inquiry_id = '44444444-4444-4444-8444-444444444444';

delete from public.inquiries
where id = '44444444-4444-4444-8444-444444444444';
```

## 이 단계에서 의도적으로 완료하지 않은 항목

- 실제 공개 문의 접수 활성화 및 실제 접수 성공 테스트
- 확정된 개인정보 처리방침, 보유 기간, 파기 자동화
- 문의 자동 알림·자동 회신 이메일
- 파일 업로드, 공개 회원가입, 다중 관리자·manager 권한
- 분산형 요청 제한, WAF, Captcha
- 운영 DB 적용과 공개 Preview 배포

특히 현재의 요청 제한은 테스트 준비를 위한 인스턴스 메모리 방식이다. 운영 공개 접수 전에는 플랫폼 WAF 또는 공유 저장소 기반 제한을 별도로 승인·구성해야 한다.

## 다음 승인 전에 확인할 사항

1. 개인정보 보유 기간·파기 방식·처리 책임자와 공개 안내 문구를 확정한다.
2. 대표 관리자 계정과 계정 복구·교체 절차를 확정한다.
3. 보호된 테스트 Preview 또는 로컬 환경에서 합성 데이터 검증을 마친다.
4. 운영 전에는 요청 제한, 보안 점검, 백업·파기 절차, 실접수 승인 여부를 별도 검토한다.
