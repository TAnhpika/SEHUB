import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQrcode } from "@fortawesome/free-solid-svg-icons";
import QrCodeSvg from "@/common/QrCodeSvg/QrCodeSvg";
import styles from "./CheckoutPage.module.css";

function isHttpUrl(value) {
  return /^https?:\/\//i.test(value ?? "");
}

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
