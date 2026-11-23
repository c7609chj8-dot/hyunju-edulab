"use client";
import { useActionState } from "react";
import { updateMember } from "./actions";
import { initialMemberEditState } from "./validation";
import styles from "../signup/signup.module.css";

type Profile = { user_id: string; full_name: string; username: string | null; address: string | null; phone: string | null; account_status: string; revision: number };
export default function MemberEditor({ profile, isAdministrator }: { profile: Profile; isAdministrator: boolean }) {
  const [state, action, pending] = useActionState(updateMember, initialMemberEditState);
  return <form action={action}>
    <input type="hidden" name="id" value={profile.user_id} /><input type="hidden" name="revision" value={state.revision ?? profile.revision} />
    <fieldset className={styles.form} disabled={pending}><legend>회원 정보 수정</legend>
      <div className={styles.field}><label htmlFor="edit-name">이름</label><input id="edit-name" name="full_name" defaultValue={profile.full_name} maxLength={80} required /></div>
      <div className={styles.field}><label htmlFor="edit-username">회원 아이디</label><input id="edit-username" name="username" defaultValue={profile.username ?? ""} minLength={4} maxLength={20} autoCapitalize="none" spellCheck={false} /><p className={styles.help}>영문 소문자로 시작하는 4~20자. 로그인에는 이메일을 사용합니다.</p></div>
      <div className={styles.field}><label htmlFor="edit-address">주소</label><input id="edit-address" name="address" defaultValue={profile.address ?? ""} autoComplete="off" maxLength={300} /></div>
      <div className={styles.field}><label htmlFor="edit-phone">전화번호</label><input id="edit-phone" name="phone" type="tel" defaultValue={profile.phone ?? ""} maxLength={20} placeholder="010-1234-5678" autoComplete="off" /></div>
      <div className={styles.field}>{isAdministrator ? <><p>이용 상태</p><input type="hidden" name="account_status" value="active" /><p>활성 관리자 계정은 이용 정지할 수 없습니다.</p></> : <><label htmlFor="edit-status">이용 상태</label><select id="edit-status" name="account_status" defaultValue={profile.account_status}><option value="active">이용 중</option><option value="suspended">이용 정지</option></select></>}</div>
      <button className="button" type="submit">{pending ? "저장 중…" : "변경 사항 저장"}</button>
    </fieldset><p className={state.status==="error" ? styles.error : styles.status} role="status" aria-live="polite">{state.message}</p>
  </form>;
}
