"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { signupFields, validateSignupPreview, type SignupErrors } from "./validation";
import styles from "./signup.module.css";

const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export default function SignupForm() {
  const interactive = useSyncExternalStore(subscribe, clientReady, serverReady);
  const [errors, setErrors] = useState<SignupErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("");

  function validate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const nextErrors = validateSignupPreview(new FormData(form));
    setErrors(nextErrors);
    const firstError = signupFields.find((field) => nextErrors[field]);
    if (firstError) {
      setStatus("입력 내용을 다시 확인해 주세요. 계정은 생성되지 않았습니다.");
      (form.elements.namedItem(firstError) as HTMLInputElement | null)?.focus();
      return;
    }
    form.reset();
    setShowPassword(false);
    setStatus("입력 형식을 확인했습니다. 계정은 생성되지 않았으며 입력 내용은 초기화했습니다.");
  }

  return (
    <form onSubmit={validate} noValidate aria-describedby="signup-preview" onChange={() => { setStatus(""); setErrors({}); }}>
      <fieldset className={styles.form} disabled={!interactive}>
        <legend className={styles.legend}>회원가입 정보 입력</legend>
        <p className={styles.help}>모든 항목은 필수입니다.</p>
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
          <p id="signup-password-help" className={styles.help}>12~128자를 입력해 주세요. 공백만 사용할 수 없습니다.</p>
          {errors.password ? <p id="signup-password-error" className={styles.error}>{errors.password}</p> : null}
        </div>
        <div className={styles.field}>
          <label htmlFor="signup-confirm-password">비밀번호 확인</label>
          <input id="signup-confirm-password" name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={12} maxLength={128} required aria-invalid={Boolean(errors.confirmPassword)} aria-describedby={errors.confirmPassword ? "signup-confirm-password-error" : undefined} />
          {errors.confirmPassword ? <p id="signup-confirm-password-error" className={styles.error}>{errors.confirmPassword}</p> : null}
        </div>
        <div>
          <label className={styles.confirmation} htmlFor="signup-preview-ack">
            <input id="signup-preview-ack" name="previewAcknowledged" type="checkbox" required aria-invalid={Boolean(errors.previewAcknowledged)} aria-describedby={errors.previewAcknowledged ? "signup-preview-error" : undefined} />
            <span>계정이 생성되지 않는 입력 확인용 화면임을 확인했습니다.</span>
          </label>
          {errors.previewAcknowledged ? <p id="signup-preview-error" className={styles.error}>{errors.previewAcknowledged}</p> : null}
        </div>
        <button type="submit" className={`button ${styles.submit}`}>회원가입 정보 확인</button>
        <p className={styles.status} role="status" aria-live="polite" aria-atomic="true">{status}</p>
      </fieldset>
      <noscript><p>입력 확인은 JavaScript를 켠 후 이용해 주세요. 계정은 생성되지 않습니다.</p></noscript>
    </form>
  );
}
