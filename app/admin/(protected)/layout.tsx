import Link from "next/link";
import type { ReactNode } from "react";
import { administrationAccess } from "../access";
import AdminAccessNotice from "../access-notice";
import { logout } from "../../auth/actions";
import styles from "../admin.module.css";

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const access = await administrationAccess();
  if (access.kind !== "allowed") return <AdminAccessNotice reason={access.kind} />;
  return <div className="shell"><header className={styles.header}><div><strong>관리자 센터</strong><p className={styles.identity}>{access.user.email}</p></div><nav className={styles.nav} aria-label="관리자 메뉴"><Link href="/admin">대시보드</Link><Link href="/admin/members">회원 관리</Link><Link href="/admin/inquiries">문의 관리</Link><Link href="/account">내 계정</Link><form action={logout}><button type="submit">로그아웃</button></form></nav></header>{children}</div>;
}
