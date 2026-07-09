/**
 * @fileoverview Barrel re-export skeleton loading cho khu vực Moderator SEHUB.
 *
 * Module này tái xuất toàn bộ component skeleton từ `@/common/Skeleton/StaffSkeleton`,
 * bao gồm cả alias `Moderator*` và tên gốc `Staff*`. Dùng khi trang Moderator
 * đang tải dữ liệu để hiển thị placeholder shimmer thay vì nội dung thật.
 *
 * @module features/moderator/components/ModeratorSkeleton
 * @see {@link module:common/Skeleton/StaffSkeleton} — implementation gốc
 *
 * @exports StaffContentQueueTableSkeleton — Skeleton `<tbody>` hàng đợi duyệt nội dung (checkbox + 3 cột).
 * @exports StaffContentHistoryTableSkeleton — Skeleton `<tbody>` lịch sử duyệt bài.
 * @exports StaffGenericTableSkeleton — Skeleton `<tbody>` bảng generic với số cột tùy chỉnh.
 * @exports StaffAccountsTableSkeleton — Skeleton `<tbody>` danh sách tài khoản (avatar + 6 cột).
 * @exports StaffQueueSkeleton — Skeleton danh sách thẻ queue dạng card.
 * @exports StaffDetailSkeleton — Skeleton panel chi tiết (tiêu đề, khối nội dung, nút).
 * @exports StaffFormSkeleton — Skeleton biểu mẫu / wizard (stepper + các field).
 * @exports StaffAuditListSkeleton — Skeleton danh sách audit / lịch sử dạng list.
 * @exports StaffFeaturedWorkspaceSkeleton — Skeleton workspace bài viết nổi bật (2 cột).
 * @exports StaffModalDetailSkeleton — Skeleton nội dung modal chi tiết.
 * @exports StaffStatsStripSkeleton — Skeleton dải thẻ thống kê.
 * @exports ModeratorContentQueueTableSkeleton — Alias của `StaffContentQueueTableSkeleton`.
 * @exports ModeratorContentHistoryTableSkeleton — Alias của `StaffContentHistoryTableSkeleton`.
 * @exports ModeratorAccountsTableSkeleton — Alias của `StaffAccountsTableSkeleton`.
 * @exports ModeratorQueueSkeleton — Alias của `StaffQueueSkeleton`.
 * @exports ModeratorDetailSkeleton — Alias của `StaffDetailSkeleton`.
 * @exports ModeratorFormSkeleton — Alias của `StaffFormSkeleton`.
 * @exports ModeratorAuditListSkeleton — Alias của `StaffAuditListSkeleton`.
 * @exports ModeratorFeaturedWorkspaceSkeleton — Alias của `StaffFeaturedWorkspaceSkeleton`.
 * @exports ModeratorModalDetailSkeleton — Alias của `StaffModalDetailSkeleton`.
 *
 * @example
 * import { ModeratorAccountsTableSkeleton } from '@/features/moderator/components/ModeratorSkeleton/ModeratorSkeleton';
 *
 * {isLoading ? (
 *   <table>
 *     <ModeratorAccountsTableSkeleton rows={10} />
 *   </table>
 * ) : (
 *   <AccountsTableBody data={accounts} />
 * )}
 */

export * from "@/common/Skeleton/StaffSkeleton";
