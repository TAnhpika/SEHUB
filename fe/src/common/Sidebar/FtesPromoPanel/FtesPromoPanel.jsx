import styles from "./FtesPromoPanel.module.css";

const FTES_URL = "https://ftes.vn/vi";

function FtesPromoPanel({ className = "" }) {
  return (
    <section
      className={`${styles.panel} ${className}`.trim()}
      aria-labelledby="ftes-promo-logo"
    >
      <span id="ftes-promo-logo" className={styles.logo}>
        FTES
      </span>

      <p className={styles.desc}>
        Khóa học lập trình &amp; lộ trình học dành cho sinh viên ngành SE.
      </p>

      <a
        href={FTES_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
      >
        Xem khóa học tại ftes.vn
      </a>
    </section>
  );
}

export default FtesPromoPanel;
