import { useEffect, useId, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire } from "@fortawesome/free-solid-svg-icons";
import {
  DAILY_TASKS,
  getCompletedTaskCount,
} from "./streakData";
import styles from "./StreakDropdown.module.css";

function StreakDropdown({ streakCount = 7 }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const panelId = useId();
  const completedCount = getCompletedTaskCount(DAILY_TASKS);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles["trigger-open"] : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Streak ${streakCount} ngày`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <FontAwesomeIcon icon={faFire} className={styles["fire-icon"]} />
        <span className={styles.badge}>{streakCount}</span>
      </button>

      {open && (
        <div id={panelId} className={styles.dropdown} role="dialog" aria-label="Nhiệm vụ hàng ngày">
          <header className={styles.header}>
            <h2 className={styles.title}>Nhiệm vụ hàng ngày</h2>
            <span className={styles.summary}>
              {completedCount}/{DAILY_TASKS.length}
            </span>
          </header>

          <ul className={styles.list}>
            {DAILY_TASKS.map((task) => {
              const isDone = task.current >= task.target;

              return (
                <li key={task.id} className={styles.item}>
                  <span
                    className={`${styles.check} ${isDone ? styles["check-done"] : ""}`}
                    aria-hidden="true"
                  />
                  <div className={styles.content}>
                    <p className={styles["task-title"]}>{task.title}</p>
                    <p className={styles.progress}>
                      Tiến độ: {task.current}/{task.target}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <p className={styles.footer}>
            Hoàn thành tất cả nhiệm vụ để nhận phần thưởng đặc biệt! 🔥
          </p>
        </div>
      )}
    </div>
  );
}

export default StreakDropdown;
