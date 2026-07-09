/**
 * @fileoverview Hằng số nhãn và bộ lọc cho nhật ký đóng góp đề của Moderator.
 *
 * Định nghĩa type alias JSDoc, nhãn hiển thị loại đề / trạng thái,
 * và các option dropdown lọc trên trang lịch sử đóng góp.
 *
 * @module features/moderator/exams/moderatorExamConstants
 */

/** @typedef {'practice' | 'final'} ExamContributionType */

/** @typedef {'draft_saved' | 'submitted'} ModContributionAction */

/** @typedef {'draft_saved' | 'pending_admin' | 'approved' | 'rejected' | 'revision_draft'} ContributionDisplayStatus */

/**
 * Nhãn hiển thị loại đề đóng góp trên UI.
 *
 * @constant {Record<ExamContributionType, string>}
 * @readonly
 */
export const EXAM_CONTRIBUTION_TYPE_LABELS = {
  practice: "Thực hành",
  final: "Cuối kỳ",
};

/**
 * Nhãn hiển thị trạng thái đóng góp trên UI.
 *
 * @constant {Record<string, string>}
 * @readonly
 */
export const CONTRIBUTION_STATUS_LABELS = {
  draft_saved: "Lưu nháp",
  revision_draft: "Đang sửa bản cập nhật",
  pending_admin: "Chờ Admin duyệt",
  approved: "Admin đã duyệt",
  rejected: "Admin từ chối",
};

/**
 * Option lọc loại đề trên trang lịch sử đóng góp.
 *
 * @constant {ReadonlyArray<{ id: string, label: string }>}
 * @readonly
 */
export const CONTRIBUTION_TYPE_FILTERS = [
  { id: "all", label: "Tất cả loại đề" },
  { id: "final", label: "Cuối kỳ" },
  { id: "practice", label: "Thực hành" },
];

/**
 * Option lọc trạng thái đóng góp trên trang lịch sử.
 *
 * @constant {ReadonlyArray<{ id: string, label: string }>}
 * @readonly
 */
export const CONTRIBUTION_STATUS_FILTERS = [
  { id: "all", label: "Mọi trạng thái" },
  { id: "draft_saved", label: "Lưu nháp" },
  { id: "revision_draft", label: "Đang sửa cập nhật" },
  { id: "pending_admin", label: "Chờ Admin duyệt" },
  { id: "approved", label: "Đã duyệt" },
  { id: "rejected", label: "Từ chối" },
];
