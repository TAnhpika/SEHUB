import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare, faGraduationCap } from "@fortawesome/free-solid-svg-icons";
import styles from "./FtesPromoPanel.module.css";

const FTES_URL = "https://ftes.vn/vi";

function FtesPromoPanel({ className = "" }) {
  return (
    <section
      className={`${styles.panel} ${className}`.trim()}
      aria-labelledby="ftes-promo-title"
    >
      <div className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          <FontAwesomeIcon icon={faGraduationCap} />
        </span>
        <h2 id="ftes-promo-title" className={styles.title}>
          Học cùng FTES
        </h2>
      </div>

      <p className={styles.desc}>
        Nền tảng học trực tuyến đồng hành sinh viên SE — khóa học, lộ trình và cộng đồng học
        tập thực chiến.
      </p>

      <a
        href={FTES_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.cta}
      >
        Khám phá FTES
        <FontAwesomeIcon icon={faArrowUpRightFromSquare} className={styles["cta-icon"]} />
      </a>
    </section>
  );
}

export default FtesPromoPanel;
