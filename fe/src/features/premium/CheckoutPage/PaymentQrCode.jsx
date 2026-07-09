import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQrcode } from "@fortawesome/free-solid-svg-icons";
import QrCodeSvg from "@/common/QrCodeSvg/QrCodeSvg";
import styles from "./CheckoutPage.module.css";

/**
 * @fileoverview Component hiển thị mã QR thanh toán PayOS hoặc fallback link.
 *
 * @module features/premium/CheckoutPage/PaymentQrCode
 */

/**
 * Kiểm tra chuỗi có phải URL http(s) hay không.
 *
 * @param {string|null|undefined} value - Giá trị cần kiểm tra.
 * @returns {boolean} `true` nếu bắt đầu bằng `http://` hoặc `https://`.
 */
function isHttpUrl(value) {
  return /^https?:\/\//i.test(value ?? "");
}

/**
 * @typedef {Object} PaymentQrCodeProps
 * @property {string|null|undefined} qrValue - Payload QR (EMV string) hoặc URL ảnh QR.
 * @property {string|null|undefined} checkoutUrl - URL trang thanh toán PayOS fallback.
 */

/**
 * Render mã QR VietQR hoặc link mở trang PayOS khi không có payload QR inline.
 *
 * Thứ tự ưu tiên:
 * 1. `qrValue` không phải URL → render `QrCodeSvg`.
 * 2. `checkoutUrl` hoặc `qrValue` là URL → link "Mở trang QR PayOS".
 * 3. Fallback → icon QR placeholder.
 *
 * @param {PaymentQrCodeProps} props - Props của component.
 * @returns {import('react').ReactElement} QR SVG, link, hoặc icon.
 *
 * @example
 * <PaymentQrCode qrValue="000201010212..." checkoutUrl="https://pay.payos.vn/..." />
 */
export default function PaymentQrCode({ qrValue, checkoutUrl }) {
  if (qrValue && !isHttpUrl(qrValue)) {
    return (
      <QrCodeSvg
        value={qrValue}
        size={128}
        className={styles["qr-image"]}
        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
      />
    );
  }

  const pageUrl = checkoutUrl || (isHttpUrl(qrValue) ? qrValue : null);
  if (pageUrl) {
    return (
      <a href={pageUrl} target="_blank" rel="noreferrer" className={styles["qr-fallback"]}>
        <FontAwesomeIcon icon={faQrcode} className={styles["qr-icon"]} />
        <span>Mở trang QR PayOS</span>
      </a>
    );
  }

  return <FontAwesomeIcon icon={faQrcode} className={styles["qr-icon"]} />;
}
