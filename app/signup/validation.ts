export const signupFields = ["name", "email", "password", "confirmPassword", "ageConfirmed", "privacyConsent", "overseasConsent"] as const;
export type SignupField = (typeof signupFields)[number];
export type SignupErrors = Partial<Record<SignupField, string>>;

export function validateSignup(data: FormData): SignupErrors {
  const read = (key: SignupField) => {
    const value = data.get(key);
    return typeof value === "string" ? value : "";
  };
  const errors: SignupErrors = {};
  const name = read("name").trim();
  const email = read("email").trim();
  const password = read("password");

  if (!name || name.length > 80) errors.name = "이름을 1~80자로 입력해 주세요.";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
    errors.email = "올바른 이메일 주소를 입력해 주세요.";
  }
  if (password.length < 12 || password.length > 128 || !password.trim()) {
    errors.password = "비밀번호를 공백만 사용하지 않고 12~128자로 입력해 주세요.";
  }
  if (!read("confirmPassword") || password !== read("confirmPassword")) {
    errors.confirmPassword = "비밀번호가 일치하지 않습니다.";
  }
  if (read("ageConfirmed") !== "on") errors.ageConfirmed = "만 14세 이상인 경우에만 가입할 수 있습니다.";
  if (read("privacyConsent") !== "on") errors.privacyConsent = "개인정보 수집·이용 안내를 확인하고 동의해 주세요.";
  if (read("overseasConsent") !== "on") errors.overseasConsent = "개인정보 국외 이전 안내를 확인하고 동의해 주세요.";
  return errors;
}
