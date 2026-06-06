import styles from "./charts.module.css";

/**
 * @param {{ items: { label: string; value: number; color: string }[] }} props
 */
function DashboardHorizontalBars({ items }) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <ul className={styles.hBarList}>
      {items.map((item) => {
        const pct = (item.value / max) * 100;
        return (
          <li key={item.label} className={styles.hBarItem}>
            <div className={styles.hBarHead}>
              <span className={styles.hBarLabel}>{item.label}</span>
              <span className={styles.hBarValue}>{item.value}</span>
            </div>
            <div className={styles.hBarTrack}>
              <div
                className={styles.hBarFill}
                style={{ width: `${pct}%`, background: item.color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default DashboardHorizontalBars;
