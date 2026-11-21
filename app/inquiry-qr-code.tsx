import Link from "next/link";
import QRCode from "qrcode";
import { siteUrl } from "./seo";

const inquiryUrl = new URL("/contact", siteUrl).toString();
const inquiryQrMarkup = QRCode.toString(inquiryUrl, {
  type: "svg",
  width: 176,
  margin: 1,
  errorCorrectionLevel: "M",
  color: { dark: "#071923", light: "#ffffff" },
});

export default async function InquiryQrCode() {
  const qrCode = await inquiryQrMarkup;

  return (
    <aside className="footer-qr" aria-label="강의 의뢰 QR 코드">
      <div className="footer-qr-code" aria-hidden="true" dangerouslySetInnerHTML={{ __html: qrCode }} />
      <div>
        <p className="footer-qr-label">SCAN TO INQUIRE</p>
        <p className="footer-qr-copy">QR을 스캔하면 강의 의뢰 화면으로 이동합니다.</p>
        <Link href="/contact" className="footer-qr-link">강의 의뢰하기</Link>
      </div>
    </aside>
  );
}
