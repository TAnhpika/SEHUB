import { HEATMAP_DATA } from "@/features/profile/profileData";
import styles from "./ActivityHeatmap.module.css";

const LEVEL_CLASS = {
  0: styles.l0,
  1: styles.l1,
  2: styles.l2,
  3: styles.l3,
};

const DAY_LABEL_ROWS = [0, 2, 4];
const WEEKS = 26;

function ActivityHeatmap({ totalActivities }) {
  const weeks = Array.from({ length: WEEKS }, (_, index) => index);
  const isEmpty = totalActivities === 0;

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <h2 className={styles.title}>Hoạt động</h2>
        <p className={styles.subtitle}>{totalActivities} hoạt động trong 6 tháng qua</p>
      </header>

      {isEmpty ? (
        <p className={styles.empty}>Chưa có hoạt động nào. Bắt đầu hoạt động!</p>
      ) : (
      <div className={styles.chart}>
        <div className={styles.months} aria-hidden="true">
          {HEATMAP_DATA.months.map((month) => (
            <span key={month} className={styles.month}>
              {month}
            </span>
          ))}
        </div>

        <div className={styles["grid-wrap"]}>
          <div className={styles.days} aria-hidden="true">
            {DAY_LABEL_ROWS.map((dayIndex) => (
              <span
                key={dayIndex}
                className={styles.day}
                style={{ "--row-index": dayIndex }}
              >
                {HEATMAP_DATA.dayLabels[dayIndex]}
              </span>
            ))}
          </div>

          <div className={styles.grid} role="img" aria-label="Biểu đồ hoạt động 6 tháng">
            {weeks.map((week) => (
              <div key={week} className={styles.column}>
                {HEATMAP_DATA.dayLabels.map((_, day) => {
                  const cell = HEATMAP_DATA.cells.find(
                    (item) => item.week === week && item.day === day,
                  );
                  const level = cell?.level ?? 0;

                  return (
                    <span
                      key={`${week}-${day}`}
                      className={`${styles.cell} ${LEVEL_CLASS[level]}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.legend}>
          <span>Ít</span>
          <span className={`${styles["legend-cell"]} ${styles.l1}`} />
          <span className={`${styles["legend-cell"]} ${styles.l2}`} />
          <span className={`${styles["legend-cell"]} ${styles.l3}`} />
          <span>Nhiều</span>
        </div>
      </div>
      )}
    </section>
  );
}

export default ActivityHeatmap;
