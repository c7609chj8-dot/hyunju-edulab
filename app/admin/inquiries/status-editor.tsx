"use client";

import { useActionState } from "react";
import { changeInquiryStatus, type InquiryStatusState } from "./actions";
import type { InquiryStatus } from "../../inquiries/workflow";
import { inquiryStatusLabels } from "./view";
import styles from "../../signup/signup.module.css";

const initialState: InquiryStatusState = { kind: "idle", message: "" };

export default function InquiryStatusEditor({ id, status, revision, nextStatuses }: {
  id: string;
  status: string;
  revision: number;
  nextStatuses: readonly InquiryStatus[];
}) {
  const [state, action, pending] = useActionState(changeInquiryStatus, initialState);

  return (
    <section>
      <h2>상태 변경</h2>
      {nextStatuses.length ? (
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="currentStatus" value={status} />
          <input type="hidden" name="revision" value={revision} />
          <fieldset className={styles.form} disabled={pending} aria-label="문의 상태 변경">
            <div className={styles.field}>
              <label htmlFor="next-inquiry-status">변경할 상태</label>
              <select id="next-inquiry-status" name="nextStatus" defaultValue="" required>
                <option value="" disabled>상태 선택</option>
                {nextStatuses.map((value) => <option key={value} value={value}>{inquiryStatusLabels[value]}</option>)}
              </select>
            </div>
            <button className="button" type="submit">{pending ? "저장 중…" : "상태 저장"}</button>
          </fieldset>
        </form>
      ) : <p>변경할 수 있는 상태가 없습니다.</p>}
      <p className={state.kind === "error" ? styles.error : styles.status} role="status">{state.message}</p>
    </section>
  );
}
