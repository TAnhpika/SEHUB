import { useEffect, useId, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context";
import { useHoverDropdown } from "@/hooks/useHoverDropdown";
import Shimmer from "@/common/Skeleton/Shimmer";
import { getCompletedTaskCount, loadDailyTasks } from "./streakData";
import styles from "./StreakDropdown.module.css";

const SKELETON_COUNT = 4;

function TaskSkeletonList() {
  return (
    <ul className={styles.list} aria-busy="true" aria-label="Đang tải nhiệm vụ">
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <li key={index} className={styles.skeletonItem}>
          <Shimmer className={styles.skeletonCheck} />
          <div className={styles.skeletonContent}>
            <Shimmer className={styles.skeletonLine} />
            <Shimmer className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function StreakDropdown() {
  const { user } = useAuth();
  const { open, setOpen, rootProps, handleTriggerClick } = useHoverDropdown();
  const rootRef = useRef(null);
  const panelId = useId();
  const streakDays = user?.streak ?? 0;
  const [dailyTasks, setDailyTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const completedCount = getCompletedTaskCount(dailyTasks);

  useEffect(() => {
    let cancelled = false;

    async function fetchTasks() {
      setIsLoading(true);
      const { tasks, error } = await loadDailyTasks();
      if (!cancelled) {
        setDailyTasks(tasks);
        setLoadError(Boolean(error));
        setIsLoading(false);
      }
    }

    fetchTasks();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen]);

  const summaryLabel = isLoading
    ? "…"
    : loadError
      ? "—"
      : `${completedCount}/${dailyTasks.length}`;

  return (
    <div className={styles.root} ref={rootRef} {...rootProps}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles["trigger-open"] : ""}`}
        onClick={handleTriggerClick}
        aria-label={
          isLoading
            ? `Streak ${streakDays} ngày, đang tải nhiệm vụ`
            : `Streak ${streakDays} ngày, ${completedCount}/${dailyTasks.length} nhiệm vụ hoàn thành`
        }
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <FontAwesomeIcon icon={faFire} className={styles["fire-icon"]} />
        {streakDays > 0 && <span className={styles.badge}>{streakDays}</span>}
      </button>

      {open && (
        <div
          id={panelId}
          className={styles.dropdown}
          role="region"
          aria-label="Nhiệm vụ hàng ngày"
        >
          <header className={styles.header}>
            <div>
              <h2 className={styles.title}>Nhiệm vụ hàng ngày</h2>
              <p className={styles.streakMeta}>Streak {streakDays} ngày liên tiếp</p>
            </div>
            <span className={styles.summary}>{summaryLabel}</span>
          </header>

          {isLoading ? (
            <TaskSkeletonList />
          ) : loadError ? (
            <p className={styles.errorState}>Không tải được nhiệm vụ. Thử lại sau.</p>
          ) : dailyTasks.length === 0 ? (
            <p className={styles.emptyState}>Chưa có nhiệm vụ hôm nay</p>
          ) : (
            <ul className={styles.list}>
              {dailyTasks.map((task) => {
                const isDone = task.isCompleted || task.current >= task.target;

                return (
                  <li key={task.id} className={styles.item}>
                    <span
                      className={`${styles.check} ${isDone ? styles["check-done"] : ""}`}
                      aria-hidden="true"
                    />
                    <div className={styles.content}>
                      <div className={styles.taskHeader}>
                        <p className={styles["task-title"]}>{task.title}</p>
                        {task.rewardPoints > 0 && (
                          <span className={styles.reward}>+{task.rewardPoints} điểm</span>
                        )}
                      </div>
                      <p className={styles.progress}>
                        Tiến độ: {task.current}/{task.target}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <p className={styles.footer}>
            Hoàn thành cả 3 nhiệm vụ hôm nay để nhận phần thưởng đặc biệt! 🔥
          </p>
        </div>
      )}
    </div>
  );
}

export default StreakDropdown;
