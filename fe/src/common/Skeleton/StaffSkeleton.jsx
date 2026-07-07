import Shimmer from "@/common/Skeleton/Shimmer";
import { SKELETON_PAGE_ROWS } from "@/common/Skeleton/skeletonConstants";
import styles from "./StaffSkeleton.module.css";

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

export function StaffContentQueueTableSkeleton({
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

export function StaffContentHistoryTableSkeleton({
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

export function StaffGenericTableSkeleton({
  rows = SKELETON_PAGE_ROWS,
  columns = 5,
  "aria-label": ariaLabel = "Đang tải danh sách",
}) {
  return (
    <tbody aria-busy="true" aria-label={ariaLabel}>
      <TableSkeletonRows rows={rows}>
        {() => (
          <>
            {Array.from({ length: columns }, (_, columnIndex) => (
              <td key={columnIndex}>
                <Shimmer
                  className={columnIndex === 0 ? styles.lineMd : styles.cellShimmer}
                />
              </td>
            ))}
          </>
        )}
      </TableSkeletonRows>
    </tbody>
  );
}

export function StaffAccountsTableSkeleton({
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

export function StaffQueueSkeleton({
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

export function StaffDetailSkeleton({
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

export function StaffFormSkeleton({
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

export function StaffAuditListSkeleton({
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

export function StaffFeaturedWorkspaceSkeleton({
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

export function StaffModalDetailSkeleton({
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

export function StaffStatsStripSkeleton({
  count = 3,
  "aria-label": ariaLabel = "Đang tải thống kê",
}) {
  return (
    <div className={styles.statsStrip} aria-busy="true" aria-label={ariaLabel}>
      {Array.from({ length: count }, (_, index) => (
        <Shimmer key={index} className={styles.statCard} />
      ))}
    </div>
  );
}

export const ModeratorContentQueueTableSkeleton = StaffContentQueueTableSkeleton;
export const ModeratorContentHistoryTableSkeleton = StaffContentHistoryTableSkeleton;
export const ModeratorAccountsTableSkeleton = StaffAccountsTableSkeleton;
export const ModeratorQueueSkeleton = StaffQueueSkeleton;
export const ModeratorDetailSkeleton = StaffDetailSkeleton;
export const ModeratorFormSkeleton = StaffFormSkeleton;
export const ModeratorAuditListSkeleton = StaffAuditListSkeleton;
export const ModeratorFeaturedWorkspaceSkeleton = StaffFeaturedWorkspaceSkeleton;
export const ModeratorModalDetailSkeleton = StaffModalDetailSkeleton;
