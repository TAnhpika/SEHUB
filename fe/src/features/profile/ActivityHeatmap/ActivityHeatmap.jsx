import styles from "./ActivityHeatmap.module.css";
import { HEATMAP_WEEKS } from "@/utils/heatmapCalendar";

const LEVEL_CLASS = {
  0: styles.l0,
  1: styles.l1,
  2: styles.l2,
  3: styles.l3,
};

const DAY_LABEL_ROWS = [0, 2, 4];

function formatActivityLabel(cell) {
  if (!cell?.date) {
    return "Không có hoạt động";
  }

  const count = cell.count ?? 0;
  if (count <= 0) {
    return `${cell.date}, không có hoạt động`;
  }

  return `${cell.date}, ${count} hoạt động`;
}

function ActivityHeatmap({
  streakCount = 0,
  totalActivities = 0,
  showChart = false,
  heatmapData = null,
}) {
  const weeks = Array.from({ length: HEATMAP_WEEKS }, (_, index) => index);
  const chartData = heatmapData;
  const showHeatmapChart = showChart && totalActivities > 0 && chartData?.cells?.length;

  let subtitle = "Biểu đồ hoạt động sẽ có trong bản cập nhật sau";
  if (showHeatmapChart) {
    subtitle = `${totalActivities} hoạt động trong 6 tháng qua`;
  } else if (streakCount > 0) {
    subtitle = `${streakCount} ngày streak`;
  }

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <h2 className={styles.title}>Hoạt động</h2>
        <p className={styles.subtitle}>{subtitle}</p>
      </header>

      {!showHeatmapChart ? (
        <p className={styles.empty}>
          {totalActivities > 0
            ? "Chưa đủ dữ liệu để hiển thị biểu đồ chi tiết."
            : streakCount > 0
              ? "Biểu đồ hoạt động chi tiết sẽ có khi bạn tích lũy thêm hoạt động."
              : "Chưa có hoạt động nào. Bắt đầu đăng bài, bình luận hoặc làm bài thi!"}
        </p>
      ) : (
        <div className={styles.chart}>
          <div className={styles.months} aria-hidden="true">
            {weeks.map((week) => {
              const label = chartData.months[week];
              if (!label) return null;

              return (
                <span
                  key={week}
                  className={styles.month}
                  style={{ "--week-index": week }}
                >
                  {label}
                </span>
              );
            })}
          </div>

          <div className={styles["grid-wrap"]}>
            <div className={styles.days} aria-hidden="true">
              {DAY_LABEL_ROWS.map((dayIndex) => (
                <span
                  key={dayIndex}
                  className={styles.day}
                  style={{ "--row-index": dayIndex }}
                >
                  {chartData.dayLabels[dayIndex]}
                </span>
              ))}
            </div>

            <div
              className={styles.grid}
              role="img"
              aria-label={`Biểu đồ hoạt động 6 tháng, ${totalActivities} hoạt động`}
            >
              {weeks.map((week) => (
                <div key={week} className={styles.column}>
                  {chartData.dayLabels.map((_, day) => {
                    const cell = chartData.cells.find(
                      (item) => item.week === week && item.day === day,
                    );
                    const level = cell?.level ?? 0;
                    const label = formatActivityLabel(cell);

                    return (
                      <span
                        key={`${week}-${day}`}
                        className={`${styles.cell} ${LEVEL_CLASS[level]}`}
                        title={label}
                        aria-label={label}
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
