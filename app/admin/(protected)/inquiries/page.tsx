import Link from "next/link";
import { administrationAccess } from "../../access";
import AdminAccessNotice from "../../access-notice";
import { inquiryStatusValues } from "../../../inquiries/workflow";
import {
  inquiryDate, inquiryListQuery, inquiryListSelection, inquiryPageSize,
  inquiryStatusLabel, inquiryStatusLabels, inquiryTypeLabel, type InquiryListParams,
} from "../../inquiries/view";
import styles from "../../members/members.module.css";

const listPath = "/admin/inquiries";

export const metadata = { title: "문의 관리 | 현주에듀랩" };

export default async function InquiriesPage({ searchParams }: { searchParams: Promise<InquiryListParams> }) {
  const access = await administrationAccess();
  if (access.kind !== "allowed") return <AdminAccessNotice reason={access.kind} />;

  const { status, page } = inquiryListSelection(await searchParams);
  let query = access.client.from("inquiries")
    .select("id,inquiry_number,inquiry_type,sender_name,status,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  if (status) query = query.eq("status", status);

  const offset = (page - 1) * inquiryPageSize;
  const { data, count, error, status: responseStatus } = await query.range(offset, offset + inquiryPageSize - 1);
  const firstPageHref = listPath + inquiryListQuery(status, 1);
  const outsideRange = page > 1 && (responseStatus === 416 || (!error && !data?.length));

  return (
    <section className="section content-page">
      <h1>강의 문의 관리</h1>
      <form className={styles.search} action={listPath} method="get">
        <label htmlFor="inquiry-status">처리 상태</label>
        <div>
          <select id="inquiry-status" name="status" key={status ?? "all"} defaultValue={status ?? ""}>
            <option value="">전체 상태</option>
            {inquiryStatusValues.map((value) => <option key={value} value={value}>{inquiryStatusLabels[value]}</option>)}
          </select>
          <button className="button" type="submit">필터 적용</button>
        </div>
      </form>
      {outsideRange ? (
        <p className="section-action">이 페이지에 문의가 없습니다. <Link href={firstPageHref}>첫 페이지로 이동</Link></p>
      ) : error ? (
        <p role="alert">문의 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      ) : (
        <>
          <p className="section-action">총 {count ?? 0}건 · {page}페이지</p>
          <div className={styles.tableWrap} tabIndex={0} role="region" aria-label="문의 목록 가로 스크롤">
            <table className={styles.table}>
              <caption className={styles.caption}>강의 문의 목록</caption>
              <thead><tr><th scope="col">접수번호</th><th scope="col">문의 유형</th><th scope="col">문의자</th><th scope="col">상태</th><th scope="col">접수 시각</th></tr></thead>
              <tbody>
                {data?.length ? data.map((inquiry) => (
                  <tr key={inquiry.id}>
                    <td><Link className="program-link" href={`${listPath}/${inquiry.id}${inquiryListQuery(status, page)}`}>{inquiry.inquiry_number}</Link></td>
                    <td>{inquiryTypeLabel(inquiry.inquiry_type)}</td>
                    <td>{inquiry.sender_name}</td>
                    <td>{inquiryStatusLabel(inquiry.status)}</td>
                    <td>{inquiryDate(inquiry.created_at)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={5}>조건에 맞는 문의가 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {(page > 1 || page * inquiryPageSize < (count ?? 0)) && (
            <nav className={styles.pagination} aria-label="문의 목록 페이지">
              {page > 1 && <Link href={listPath + inquiryListQuery(status, page - 1)}>이전 페이지</Link>}
              {page * inquiryPageSize < (count ?? 0) && <Link href={listPath + inquiryListQuery(status, page + 1)}>다음 페이지</Link>}
            </nav>
          )}
        </>
      )}
    </section>
  );
}
