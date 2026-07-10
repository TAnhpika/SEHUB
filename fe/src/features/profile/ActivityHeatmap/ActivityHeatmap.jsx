import { useMemo } from "react";
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

function computeInsights(cells = []) {
  if (!cells.length) {
    return { thisWeek: 0, activeDays: 0, bestDay: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);

  let thisWeek = 0;
  let activeDays = 0;
  let bestDay = 0;

  cells.forEach((cell) => {
    const count = cell.count ?? 0;
    if (count <= 0) return;

    activeDays += 1;
    bestDay = Math.max(bestDay, count);

    if (cell.date) {
      const [y, m, d] = cell.date.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      if (date >= weekAgo && date <= today) {
        thisWeek += count;
      }
    }
  });

  return { thisWeek, activeDays, bestDay };
}

function ActivityHeatmap({
  streakCount = 0,
  totalActivities = 0,
  showChart = false,
  heatmapData = null,
}) {
  const weeks = useMemo(
    () => Array.from({ length: HEATMAP_WEEKS }, (_, index) => index),
    [],
  );

  const chartData = heatmapData;
  const showHeatmapChart = showChart && chartData?.cells?.length;
  const insights = useMemo(
    () => computeInsights(chartData?.cells),
    [chartData?.cells],
  );

  let subtitle = "Biểu đồ hoạt động sẽ có trong bản cập nhật sau";
  if (showHeatmapChart) {
    subtitle = `${totalActivities} hoạt động trong 6 tháng qua`;
  } else if (streakCount > 0) {
    subtitle = `${streakCount} ngày streak`;
  }

  return (
    <section className={styles.panel}>
      {!showHeatmapChart ? (
        <>
          <header className={styles.header}>
            <h2 className={styles.title}>Hoạt động</h2>
            <p className={styles.subtitle}>{subtitle}</p>
          </header>
          <p className={styles.empty}>
            {totalActivities > 0
              ? "Chưa đủ dữ liệu để hiển thị biểu đồ chi tiết."
              : streakCount > 0
                ? "Biểu đồ hoạt động chi tiết sẽ có khi bạn tích lũy thêm hoạt động."
                : "Chưa có hoạt động nào. Bắt đầu đăng bài, bình luận hoặc làm bài thi!"}
          </p>
        </>
      ) : (
        <div
          className={styles.chart}
          style={{ "--heatmap-weeks": HEATMAP_WEEKS }}
        >
          <header className={styles.headerTop}>
            <h2 className={styles.title}>Hoạt động</h2>
            <p className={styles.subtitle}>{subtitle}</p>
          </header>

          <div className={styles.chartBody}>
            <div className={styles.plotColumn}>
              <div className={styles.plot}>
                <div className={styles.monthRow} aria-hidden="true">
                  {weeks.map((week) => {
                    const label = chartData.months[week];
                    if (!label) return null;

                    return (
                      <span
                        key={week}
                        className={styles.monthLabel}
                        style={{ "--week-index": week }}
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>

                <div className={styles.dayLabels} aria-hidden="true">
                  {chartData.dayLabels.map((label, dayIndex) => (
                    <span key={dayIndex} className={styles.dayLabel}>
                      {DAY_LABEL_ROWS.includes(dayIndex) ? label : ""}
                    </span>
                  ))}
                </div>

                <div
                  className={styles.grid}
                  role="img"
                  aria-label={`Biểu đồ hoạt động 6 tháng, ${totalActivities} hoạt động`}
                >
                  {weeks.flatMap((week) =>
                    chartData.dayLabels.map((_, day) => {
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
                    }),
                  )}
                </div>

                <div className={styles.legend}>
                  <span>Ít</span>
                  <span className={`${styles.legendCell} ${styles.l0}`} aria-hidden="true" />
                  <span className={`${styles.legendCell} ${styles.l1}`} aria-hidden="true" />
                  <span className={`${styles.legendCell} ${styles.l2}`} aria-hidden="true" />
                  <span className={`${styles.legendCell} ${styles.l3}`} aria-hidden="true" />
                  <span>Nhiều</span>
                </div>
              </div>
            </div>

            <aside className={styles.stats} aria-label="Thống kê hoạt động">
              <div className={styles.stat}>
                <span className={styles.statValue}>{streakCount}</span>
                <span className={styles.statLabel}>Ngày streak</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{insights.thisWeek}</span>
                <span className={styles.statLabel}>Tuần này</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{insights.activeDays}</span>
                <span className={styles.statLabel}>Ngày có hoạt động</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{insights.bestDay}</span>
                <span className={styles.statLabel}>Kỷ lục 1 ngày</span>
              </div>
            </aside>
          </div>
        </div>
      )}
    </section>
  );
}

export default ActivityHeatmap;
