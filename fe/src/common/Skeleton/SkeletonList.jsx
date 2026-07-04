import Shimmer from "@/common/Skeleton/Shimmer";
import { SKELETON_MODAL_ROWS } from "@/common/Skeleton/skeletonConstants";
import styles from "./SkeletonList.module.css";

function SkeletonList({
  count = SKELETON_MODAL_ROWS,
  variant = "default",
  className,
  "aria-label": ariaLabel = "Đang tải",
}) {
  const rowClassName =
    variant === "compact"
      ? `${styles.row} ${styles.rowCompact}`
      : variant === "wide"
        ? `${styles.row} ${styles.rowWide}`
        : variant === "card"
          ? `${styles.row} ${styles.rowCard}`
          : styles.row;

  const listClassName =
    variant === "card"
      ? `${styles.list} ${styles.listCard}`
      : styles.list;

  return (
    <div
      className={[listClassName, className].filter(Boolean).join(" ")}
      aria-busy="true"
      aria-label={ariaLabel}
    >
      {Array.from({ length: count }, (_, index) => (
        <Shimmer key={index} className={rowClassName} />
      ))}
    </div>
  );
}

export default SkeletonList;
