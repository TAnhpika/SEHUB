import styles from "./FtesPromoPanel.module.css";

const FTES_URL = "https://ftes.vn/vi";
const FTES_LOGO_URL = "https://ftes.vn/home/LOGO_FTES.svg";

function FtesPromoPanel({ className = "" }) {
  return (
    <section
      className={`${styles.panel} ${className}`.trim()}
      aria-labelledby="ftes-promo-logo"
    >
      <img
        id="ftes-promo-logo"
        src={FTES_LOGO_URL}
        alt="FTES"
        className={styles.logo}
        width={88}
        height={32}
        loading="lazy"
        decoding="async"
      />

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
