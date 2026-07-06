import Shimmer from "@/common/Skeleton/Shimmer";
import { SKELETON_PAGE_ROWS } from "@/common/Skeleton/skeletonConstants";
import styles from "./ModeratorSkeleton.module.css";

function TableSkeletonRows({ rows, children }) {
  return (
    <>
      {Array.from({ length: rows }, (_, index) => (
        <tr key={index} className={styles.tableRow}>
          {children(index)}
        </tr>
      ))}
    </>
  );
}

export function ModeratorContentQueueTableSkeleton({
  rows = SKELETON_PAGE_ROWS,
  "aria-label": ariaLabel = "Đang tải hàng đợi duyệt",
}) {
  return (
    <tbody aria-busy="true" aria-label={ariaLabel}>
      <TableSkeletonRows rows={rows}>
        {() => (
          <>
            <td>
              <Shimmer className={styles.checkShimmer} />
            </td>
            <td>
              <Shimmer className={styles.lineLg} />
              <Shimmer className={styles.lineSm} />
            </td>
            <td>
              <Shimmer className={styles.lineMd} />
            </td>
            <td>
              <Shimmer className={styles.lineSm} />
            </td>
          </>
        )}
      </TableSkeletonRows>
    </tbody>
  );
}

export function ModeratorContentHistoryTableSkeleton({
  rows = SKELETON_PAGE_ROWS,
  "aria-label": ariaLabel = "Đang tải lịch sử duyệt",
}) {
  return (
    <tbody aria-busy="true" aria-label={ariaLabel}>
      <TableSkeletonRows rows={rows}>
        {() => (
          <>
            <td>
              <Shimmer className={styles.lineLg} />
              <Shimmer className={styles.lineSm} />
            </td>
            <td>
              <Shimmer className={styles.lineMd} />
            </td>
            <td>
              <Shimmer className={styles.cellShimmer} />
            </td>
            <td>
              <Shimmer className={styles.lineSm} />
            </td>
          </>
        )}
      </TableSkeletonRows>
    </tbody>
  );
}

export function ModeratorAccountsTableSkeleton({
  rows = SKELETON_PAGE_ROWS,
  "aria-label": ariaLabel = "Đang tải danh sách tài khoản",
}) {
  return (
    <tbody aria-busy="true" aria-label={ariaLabel}>
      <TableSkeletonRows rows={rows}>
        {() => (
          <>
            <td>
              <div className={styles.accountsCell}>
                <Shimmer className={styles.avatarShimmer} />
                <div className={styles.accountsLines}>
                  <Shimmer className={styles.lineMd} />
                  <Shimmer className={styles.lineSm} />
                </div>
              </div>
            </td>
            <td>
              <Shimmer className={styles.lineMd} />
              <Shimmer className={styles.lineSm} />
            </td>
            <td>
              <Shimmer className={styles.cellShimmer} />
            </td>
            <td>
              <Shimmer className={styles.cellShimmer} />
            </td>
            <td>
              <Shimmer className={styles.cellShimmerWide} />
            </td>
            <td>
              <Shimmer className={styles.cellShimmerWide} />
            </td>
            <td>
              <Shimmer className={styles.cellShimmer} />
            </td>
          </>
        )}
      </TableSkeletonRows>
    </tbody>
  );
}

export function ModeratorQueueSkeleton({
  count = SKELETON_PAGE_ROWS,
  className,
  "aria-label": ariaLabel = "Đang tải danh sách",
}) {
  return (
    <div
      className={[styles.queueList, className].filter(Boolean).join(" ")}
      aria-busy="true"
      aria-label={ariaLabel}
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={styles.queueCard}>
          <Shimmer className={styles.queueAvatar} />
          <div className={styles.queueBody}>
            <Shimmer className={styles.lineMd} />
            <Shimmer className={styles.lineSm} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ModeratorDetailSkeleton({
  className,
  "aria-label": ariaLabel = "Đang tải chi tiết",
}) {
  return (
    <div
      className={[styles.detailPanel, className].filter(Boolean).join(" ")}
      aria-busy="true"
      aria-label={ariaLabel}
    >
      <div className={styles.detailHead}>
        <Shimmer className={styles.detailTitle} />
        <Shimmer className={styles.detailMeta} />
      </div>
      <Shimmer className={styles.detailBlock} />
      <Shimmer className={`${styles.detailBlock} ${styles.detailBlockTall}`} />
      <div className={styles.detailActions}>
        <Shimmer className={styles.actionShimmer} />
        <Shimmer className={styles.actionShimmer} />
      </div>
    </div>
  );
}

export function ModeratorFormSkeleton({
  className,
  "aria-label": ariaLabel = "Đang tải biểu mẫu",
}) {
  return (
    <div
      className={[styles.formPanel, className].filter(Boolean).join(" ")}
      aria-busy="true"
      aria-label={ariaLabel}
    >
      <Shimmer className={styles.formStepper} />
      <Shimmer className={styles.formField} />
      <Shimmer className={styles.formField} />
      <Shimmer className={`${styles.formField} ${styles.formFieldTall}`} />
      <Shimmer className={styles.formField} />
    </div>
  );
}

export function ModeratorAuditListSkeleton({
  count = SKELETON_PAGE_ROWS,
  className,
  "aria-label": ariaLabel = "Đang tải danh sách",
}) {
  return (
    <div
      className={[styles.listPanel, className].filter(Boolean).join(" ")}
      aria-busy="true"
      aria-label={ariaLabel}
    >
      <Shimmer className={styles.lineMd} />
      <div className={styles.listRows}>
        {Array.from({ length: count }, (_, index) => (
          <Shimmer key={index} className={styles.listRow} />
        ))}
      </div>
    </div>
  );
}

export function ModeratorFeaturedWorkspaceSkeleton({
  "aria-label": ariaLabel = "Đang tải bài viết nổi bật",
}) {
  return (
    <div className={styles.featuredWorkspace} aria-busy="true" aria-label={ariaLabel}>
      <div className={styles.featuredColumn}>
        <Shimmer className={styles.featuredHeading} />
        {Array.from({ length: 3 }, (_, index) => (
          <Shimmer key={index} className={styles.featuredCard} />
        ))}
      </div>
      <div className={styles.featuredColumn}>
        <Shimmer className={styles.featuredHeading} />
        {Array.from({ length: 5 }, (_, index) => (
          <Shimmer key={index} className={styles.featuredCard} />
        ))}
      </div>
    </div>
  );
}

export function ModeratorModalDetailSkeleton({
  "aria-label": ariaLabel = "Đang tải chi tiết",
}) {
  return (
    <div className={styles.modalBody} aria-busy="true" aria-label={ariaLabel}>
      <div className={styles.modalSummaryGrid}>
        {Array.from({ length: 6 }, (_, index) => (
          <Shimmer key={index} className={styles.modalField} />
        ))}
      </div>
      <Shimmer className={styles.modalHistory} />
    </div>
  );
}
