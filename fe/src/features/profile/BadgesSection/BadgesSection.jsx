import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAward, faCheck, faLock, faStar } from "@fortawesome/free-solid-svg-icons";
import styles from "./BadgesSection.module.css";

function BadgesSection({ badges }) {
  const unlockedCount = badges.filter((badge) => badge.unlocked).length;
  const isEmpty = badges.length === 0;

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Danh hiệu</h2>
          <p className={styles.subtitle}>
            {isEmpty ? "Chưa có danh hiệu nào" : `${unlockedCount}/${badges.length} đã mở khóa`}
          </p>
        </div>
        {!isEmpty ? (
          <button type="button" className={styles["view-all"]}>
            <FontAwesomeIcon icon={faAward} />
            Xem tất cả
          </button>
        ) : null}
      </header>

      {isEmpty ? (
        <div className={styles.empty}>
          <span className={styles["empty-icon"]} aria-hidden="true">
            <FontAwesomeIcon icon={faAward} />
          </span>
          <p className={styles["empty-title"]}>Chưa có danh hiệu nào</p>
          <p className={styles["empty-desc"]}>
            Hoàn thành hoạt động trên SEHUB để mở khóa danh hiệu đầu tiên.
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {badges.map((badge) => (
            <article
              key={badge.id}
              className={`${styles.badge} ${badge.unlocked ? styles.unlocked : styles.locked}`}
            >
              <span className={styles.icon} aria-hidden="true">
                <FontAwesomeIcon icon={badge.unlocked ? faStar : faLock} />
              </span>
              {badge.unlocked && (
                <span className={styles.check} aria-label="Đã mở khóa">
                  <FontAwesomeIcon icon={faCheck} />
                </span>
              )}
              <h3 className={styles.name}>{badge.title}</h3>
              <p className={styles.desc}>{badge.description}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default BadgesSection;
