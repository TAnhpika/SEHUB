/** @typedef {'practice' | 'final'} ExamContributionType */
/** @typedef {'draft_saved' | 'submitted'} ModContributionAction */
/** @typedef {'draft_saved' | 'pending_admin' | 'approved' | 'rejected'} ContributionDisplayStatus */

export const EXAM_CONTRIBUTION_TYPE_LABELS = {
  practice: "Thực hành",
  final: "Cuối kỳ",
};

export const CONTRIBUTION_STATUS_LABELS = {
  draft_saved: "Lưu nháp",
  pending_admin: "Chờ Admin duyệt",
  approved: "Admin đã duyệt",
  rejected: "Admin từ chối",
};

export const CONTRIBUTION_TYPE_FILTERS = [
  { id: "all", label: "Tất cả loại đề" },
  { id: "final", label: "Cuối kỳ" },
  { id: "practice", label: "Thực hành" },
];

export const CONTRIBUTION_STATUS_FILTERS = [
  { id: "all", label: "Mọi trạng thái" },
  { id: "draft_saved", label: "Lưu nháp" },
  { id: "pending_admin", label: "Chờ Admin duyệt" },
  { id: "approved", label: "Đã duyệt" },
  { id: "rejected", label: "Từ chối" },
];
