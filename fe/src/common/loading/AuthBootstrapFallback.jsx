import logoSrc from "@/img/logo.png";
import styles from "./AuthBootstrapFallback.module.css";

function AuthBootstrapFallback() {
  return (
    <div className={styles.root} role="status" aria-live="polite" aria-label="Đang tải">
      <img src={logoSrc} alt="" className={styles.logo} decoding="async" aria-hidden="true" />
      <div className={styles.spinner} aria-hidden="true" />
      <p className={styles.text}>Đang tải…</p>
    </div>
  );
}

export default AuthBootstrapFallback;
