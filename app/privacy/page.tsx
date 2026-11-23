import { membershipPolicyVersion } from "../auth/config";
import { pageMetadata } from "../seo";

export const metadata = pageMetadata("/privacy", "회원 개인정보 처리방침 | 현주에듀랩", "회원정보 처리와 국외 이전 안내", false);
export default function PrivacyPage() {
  return (
    <section className="shell section content-page">
      <h1>회원 개인정보 처리방침</h1><p className="page-lead">시행일·동의 버전: {membershipPolicyVersion}</p>
      <section className="content-section"><h2>처리 목적과 항목</h2><p>현주에듀랩은 회원 가입·식별, 이메일 인증, 로그인, 계정 운영을 위해 이름·이메일·비밀번호 인증정보·가입일·인증 여부·동의 버전과 시각을 처리합니다. 비밀번호는 인증 서비스에서 해시 처리하며 운영자는 원문을 조회하지 않습니다. 보안을 위한 접속 기록은 서비스 제공자의 운영 정책에 따라 별도로 처리될 수 있습니다. 마케팅 수신 동의는 받지 않습니다.</p></section>
      <section className="content-section"><h2>보유 기간과 파기</h2><p>회원정보는 회원 탈퇴 또는 동의 철회 처리 시까지 보유합니다. 삭제 요청은 본인 확인 후 지체 없이 처리하며, 법령에 따른 보관이 필요한 경우에는 해당 근거·기간을 별도로 안내합니다. 운영 데이터 삭제와 제공자의 백업·보안 기록 만료는 구분되며, 백업 잔존 기간은 제공자의 정책에 따릅니다.</p></section>
      <section className="content-section"><h2>처리 위탁과 국외 이전</h2><p>회원 인증·데이터 보관은 Supabase Pte. Ltd.(연락처: privacy@supabase.com)에 위탁하며, 현재 프로젝트 데이터베이스는 인도 뭄바이(ap-south-1)에 있습니다. 가입·로그인 등 서비스 이용 시 암호화 통신으로 이름·이메일·인증정보·회원 및 동의 기록이 전송·처리됩니다. 이전 목적은 회원 인증·계정 관리·정보 보관이며, 회원 탈퇴 또는 동의 철회 처리 시까지 보유합니다.</p><p><a className="program-link" href="https://supabase.com/privacy" target="_blank" rel="noreferrer">Supabase 개인정보처리방침</a> · <a className="program-link" href="https://supabase.com/legal/customer-resources/data-processing-addendum" target="_blank" rel="noreferrer">데이터 처리 부속약정</a></p><p>국외 이전 동의를 거부하거나 철회할 수 있으며, 동의하지 않으면 회원가입·로그인이 제한됩니다. 사이트 열람과 공개 교육 소개는 회원가입 없이 이용할 수 있습니다. 웹사이트 호스팅은 Vercel이 제공하며, 인증 요청과 접속 정보가 해당 인프라를 경유합니다.</p></section>
      <section className="content-section"><h2>Vercel을 통한 국외 처리</h2><p>웹사이트 호스팅·가입 및 로그인 요청 처리는 Vercel Inc.(연락처: privacy@vercel.com)에 위탁합니다. 현재 인증 요청 서버는 미국(iad1)에 있습니다. 가입·로그인 시 이름·이메일·비밀번호를 포함한 요청과 접속 정보가 암호화 통신으로 해당 서버를 거쳐 Supabase로 전달됩니다. 애플리케이션은 비밀번호 원문을 저장하거나 로그에 기록하지 않으며, 요청 처리가 끝나면 해당 처리를 종료합니다. 제공자의 접속·보안 기록 보관은 별도 운영 정책을 따릅니다.</p><p>이전 목적은 웹사이트 제공·인증 요청 처리와 보안 운영입니다. 국외 이전을 거부하거나 철회하려면 아래 운영자 연락처로 요청할 수 있으며, 거부 시 회원가입·로그인은 제한되지만 공개 페이지는 계속 열람할 수 있습니다. <a className="program-link" href="https://vercel.com/legal/privacy-notice" target="_blank" rel="noreferrer">Vercel 개인정보처리방침</a></p></section>
      <section className="content-section"><h2>권리 행사와 연락처</h2><p>개인정보 열람·정정·삭제·처리 정지·동의 철회 및 탈퇴는 현주에듀랩 운영자에게 요청할 수 있습니다. 연락처: <a href="tel:01072592558">010-7259-2558</a>. 본인 확인 후 요청을 처리하며, 만 14세 미만의 회원가입은 제공하지 않습니다.</p></section>
      <section className="content-section"><h2>접근 보호</h2><p>일반 회원은 자신의 프로필만 확인할 수 있습니다. 회원 목록은 승인된 관리자만 조회하며, 로그인 세션은 인증 쿠키로 관리합니다. 관리자 권한은 회원이 직접 변경할 수 없습니다.</p></section>
    </section>
  );
}
