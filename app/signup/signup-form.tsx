"use client";

import Link from "next/link";
import { useState, useActionState, type FormEvent } from "react";
import { signup } from "../auth/actions";
import { initialAuthState } from "../auth/state";
import { signupFields, validateSignup, type SignupErrors } from "./validation";
import styles from "./signup.module.css";

export default function SignupForm({ enabled }: { enabled: boolean }) {
  const [state, action, pending] = useActionState(signup, initialAuthState);
  const [localErrors, setErrors] = useState<SignupErrors>({});
  const errors = { ...state.errors, ...localErrors };
  const [showPassword, setShowPassword] = useState(false);

  function validate(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const nextErrors = validateSignup(new FormData(form));
    setErrors(nextErrors);
    const firstError = signupFields.find((field) => nextErrors[field]);
    if (firstError) {
      event.preventDefault();
      (form.elements.namedItem(firstError) as HTMLInputElement | null)?.focus();
      return;
    }
  }

  return (
    <form action={action} onSubmit={validate} noValidate aria-describedby="signup-notice" onChange={() => setErrors({})}>
      <fieldset className={styles.form} disabled={!enabled || pending}>
        <legend className={styles.legend}>회원가입 정보 입력</legend>
        <p className={styles.help}>선택 표시가 없는 항목은 필수입니다. 로그인에는 이메일을 사용합니다.</p>
        <div className={styles.field}>
          <label htmlFor="signup-name">이름</label>
          <input id="signup-name" name="name" autoComplete="name" placeholder="예: 홍길동" maxLength={80} required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "signup-name-error" : undefined} />
          {errors.name ? <p id="signup-name-error" className={styles.error}>{errors.name}</p> : null}
        </div>
        <div className={styles.field}>
          <label htmlFor="signup-email">이메일</label>
          <input id="signup-email" name="email" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} placeholder="sample@example.com" maxLength={254} required aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "signup-email-error" : undefined} />
          {errors.email ? <p id="signup-email-error" className={styles.error}>{errors.email}</p> : null}
        </div>
        <div className={styles.field}>
          <label htmlFor="signup-password">비밀번호</label>
          <div className={styles.passwordRow}>
            <input id="signup-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={12} maxLength={128} required aria-invalid={Boolean(errors.password)} aria-describedby={`signup-password-help${errors.password ? " signup-password-error" : ""}`} />
            <button type="button" className={styles.toggle} aria-label="비밀번호 표시" aria-pressed={showPassword} aria-controls="signup-password signup-confirm-password" onClick={() => setShowPassword((value) => !value)}>{showPassword ? "숨기기" : "보기"}</button>
          </div>
          <p id="signup-password-help" className={styles.help}>12~128자. 다른 사이트에서 사용하지 않는 비밀번호를 입력해 주세요.</p>
          {errors.password ? <p id="signup-password-error" className={styles.error}>{errors.password}</p> : null}
        </div>
        <div className={styles.field}>
          <label htmlFor="signup-confirm-password">비밀번호 확인</label>
          <input id="signup-confirm-password" name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={12} maxLength={128} required aria-invalid={Boolean(errors.confirmPassword)} aria-describedby={errors.confirmPassword ? "signup-confirm-password-error" : undefined} />
          {errors.confirmPassword ? <p id="signup-confirm-password-error" className={styles.error}>{errors.confirmPassword}</p> : null}
        </div>
        {([
          ["username", "회원 아이디 (선택)", "text", "예: safemind01", 20],
          ["address", "주소 (선택)", "text", "주소를 입력해 주세요", 300],
          ["phone", "전화번호 (선택)", "tel", "010-1234-5678", 20],
        ] as const).map(([name, label, type, placeholder, maxLength]) => <div className={styles.field} key={name}><label htmlFor={`signup-${name}`}>{label}</label><input id={`signup-${name}`} name={name} type={type} placeholder={placeholder} maxLength={maxLength} autoComplete={name === "address" ? "street-address" : name === "phone" ? "tel" : "off"} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `signup-${name}-error` : undefined} />{errors[name] ? <p className={styles.error} id={`signup-${name}-error`}>{errors[name]}</p> : null}</div>)}
        <div className={styles.consentNotice}>
          <p><strong>개인정보 수집·이용</strong></p>
          <p>이름·이메일·비밀번호 인증정보와 동의 기록을 회원 식별·로그인·계정 관리에 사용하며, 탈퇴 또는 동의 철회 처리 시 파기합니다. 회원 아이디·주소·전화번호는 선택 입력이며 회원 정보 관리에 사용합니다. 선택 항목을 입력하지 않아도 가입할 수 있습니다.</p>
          <Link href="/privacy">개인정보 처리방침과 국외 이전 상세 안내</Link>
        </div>
        {([
          ["ageConfirmed", "만 14세 이상입니다."],
          ["privacyConsent", "[필수] 개인정보 수집·이용에 동의합니다."],
          ["overseasConsent", "[필수] Vercel·Supabase를 통한 미국·일본 개인정보 이전·처리·보관에 동의합니다."],
        ] as const).map(([name, label]) => (
          <div key={name}>
            <label className={styles.confirmation} htmlFor={`signup-${name}`}>
              <input id={`signup-${name}`} name={name} type="checkbox" required aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `signup-${name}-error` : undefined} />
              <span>{label}</span>
            </label>
            {errors[name] ? <p id={`signup-${name}-error`} className={styles.error}>{errors[name]}</p> : null}
          </div>
        ))}
        <button type="submit" className={`button ${styles.submit}`}>{pending ? "가입 처리 중…" : "회원가입"}</button>
      </fieldset>
      <p className={state.status === "error" ? styles.error : styles.status} role="status" aria-live="polite" aria-atomic="true">{state.message}</p>
      <p className={styles.help}>이미 가입하셨나요? <Link href="/login">로그인</Link> · <Link href="/account">내 계정</Link></p>
    </form>
  );
}
