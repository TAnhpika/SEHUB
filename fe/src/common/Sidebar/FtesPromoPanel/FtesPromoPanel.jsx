import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faStar } from "@fortawesome/free-solid-svg-icons";
import ftesLogo from "@/img/ftes-logo.png";
import styles from "./FtesPromoPanel.module.css";

const FTES_URL = "https://ftes.vn/vi";

function FtesPromoPanel({ className = "" }) {
  return (
    <a
      href={FTES_URL}
      className={`${styles.card} ${className}`.trim()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Khám phá khóa học tại FTES"
    >
      <span className={styles.badge}>
        <FontAwesomeIcon icon={faStar} className={styles.badgeIcon} />
        Đối tác học tập
      </span>

      <div className={styles.logoWrap}>
        <img
          src={ftesLogo}
          alt="FTES"
          className={styles.logo}
          loading="lazy"
          decoding="async"
        />
      </div>

      <p className={styles.title}>Nâng level kỹ năng SE</p>
      <p className={styles.text}>Khóa học & lộ trình thực chiến cho sinh viên FPT.</p>

      <span className={styles.cta}>
        Khám phá khóa học
        <FontAwesomeIcon icon={faArrowRight} className={styles.ctaIcon} />
      </span>
    </a>
  );
}

export default FtesPromoPanel;
