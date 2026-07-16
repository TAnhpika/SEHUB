import { DEFAULT_REJECT_REASON } from "@/features/moderator/content/contentModerationData";
import { mapModerationPostImages } from "@/utils/mapModerationPostImages";
import {
  formatDateTimeFromApi,
  formatRelativeTimeFromApi,
  parseApiDate,
} from "@/utils/dateTime";

/**
 * @fileoverview Mapper chuyển DTO moderation bài viết từ API sang shape UI của moderator content.
 *
 * Chuẩn hóa status, tác giả, thời gian, ảnh và lịch sử moderation để các màn hình
 * danh sách/chi tiết dùng chung một cấu trúc dữ liệu ổn định.
 *
 * @module api/contentModerationMapper
 */

/**
 * @typedef {Object} ModerationRecordUi
 * @property {string} moderatorName - Tên moderator hiển thị, thường có tiền tố `@`.
 * @property {string} moderatorId - Username moderator hoặc placeholder.
 * @property {string} actionAtLabel - Thời điểm duyệt/từ chối đã format.
 * @property {string} [note] - Ghi chú khi bài được duyệt.
 * @property {string} [reason] - Lý do từ chối khi bài bị reject.
 * @property {string} [resubmitHint] - Gợi ý cho tác giả về khả năng gửi duyệt lại.
 */

/**
 * @typedef {Object} ModerationPostUiItem
 * @property {*} id - ID bài viết.
 * @property {'post'} type - Loại item moderation.
 * @property {string} title - Tiêu đề bài viết.
 * @property {string|null} content - Nội dung đầy đủ hoặc `null` ở list item.
 * @property {string} excerpt - Trích đoạn ngắn của bài viết.
 * @property {string[]} tags - Danh sách tag.
 * @property {string|undefined} semester - Nhãn học kỳ cho UI.
 * @property {string|undefined} major - Chuyên ngành nếu có.
 * @property {string} authorName - Tên tác giả ưu tiên display name.
 * @property {string} authorInitial - Ký tự đầu để render avatar placeholder.
 * @property {string} studentId - Username hiển thị cho tác giả.
 * @property {string} submittedAtLabel - Thời gian tương đối lúc gửi bài.
 * @property {string} timeLabel - Alias thời gian cho các UI khác nhau.
 * @property {string} status - Trạng thái moderation ở FE.
 * @property {boolean} resubmission - Đánh dấu bài pending nhưng từng bị xử lý trước đó.
 * @property {number} sortOrder - Mốc thời gian dạng số để sắp xếp.
 * @property {boolean} allowComments - Cho phép hiển thị/duy trì comment.
 * @property {ModerationRecordUi|null} moderation - Thông tin moderator xử lý nếu có.
 * @property {Array} images - Gallery ảnh bài viết (đã sort theo sortOrder).
 * @property {Array} attachments - Tệp đính kèm; hiện để rỗng cho bài community.
 */

/**
 * Format thời gian tương đối cho danh sách moderation.
 *
 * @param {string|null|undefined} dateStr - Chuỗi thời gian từ API.
 * @returns {string} Nhãn thời gian tương đối thân thiện với người dùng.
 */
function formatRelativeTime(dateStr) {
  return formatRelativeTimeFromApi(dateStr);
}

/**
 * Format thời gian thao tác moderation theo định dạng ngày giờ đầy đủ.
 *
 * @param {string|null|undefined} dateStr - Chuỗi ngày giờ từ API.
 * @returns {string} Nhãn thời gian đã format cho UI moderator.
 */
function formatActionTime(dateStr) {
  return formatDateTimeFromApi(dateStr);
}

/**
 * Chuẩn hóa status bài viết từ backend sang bộ trạng thái UI.
 *
 * Backend dùng `published/rejected/pending`, còn UI hiển thị `approved/rejected/pending`.
 *
 * @param {string|null|undefined} status - Trạng thái gốc từ API.
 * @returns {string} Trạng thái FE đã chuẩn hóa.
 *
 * @example
 * mapModerationUiStatus('Published'); // => 'approved'
 */
export function mapModerationUiStatus(status) {
  const value = String(status ?? "").toLowerCase();
  if (value === "published") return "approved";
  if (value === "rejected") return "rejected";
  if (value === "pending") return "pending";
  return value;
}

/**
 * Tạo block thông tin moderation history cho một bài viết.
 *
 * Bài đang `pending` không hiển thị record; bài `approved` và `rejected` sẽ có nội dung khác nhau.
 *
 * @param {Object} dto - DTO bài viết moderation từ API.
 * @param {string} uiStatus - Trạng thái FE đã chuẩn hóa.
 * @returns {ModerationRecordUi|null} Dữ liệu moderation cho panel chi tiết, hoặc `null`.
 */
function mapModerationRecord(dto, uiStatus) {
  if (uiStatus === "pending") return null;

  const isApproved = uiStatus === "approved";

  return {
    moderatorName: dto.moderatorUsername ? `@${dto.moderatorUsername}` : "—",
    moderatorId: dto.moderatorUsername ?? "—",
    actionAtLabel: dto.moderatedAt ? formatActionTime(dto.moderatedAt) : "—",
    note: isApproved
      ? dto.moderationNote || "Đã duyệt — hiển thị trên feed cộng đồng."
      : undefined,
    reason: !isApproved ? dto.moderationNote || DEFAULT_REJECT_REASON : undefined,
    resubmitHint: !isApproved
      ? "Tác giả có thể chỉnh sửa bài Rejected rồi gửi duyệt lại (Pending)."
      : undefined,
  };
}

/**
 * Map DTO bài viết moderation sang item dùng cho màn hình danh sách.
 *
 * @param {Object} dto - Bài viết community từ API moderation.
 * @returns {ModerationPostUiItem} Item FE đã chuẩn hóa để render list/cards.
 */
export function mapModerationPostListItem(dto) {
  const uiStatus = mapModerationUiStatus(dto.status);
  const authorLabel = dto.author?.displayName?.trim() || dto.author?.username || "Unknown";
  const createdAt = dto.createdAt;
  const images = mapModerationPostImages(dto.images ?? []);

  return {
    id: dto.id != null ? String(dto.id) : dto.id,
    type: "post",
    title: dto.title,
    excerpt: dto.excerpt,
    content: null,
    tags: dto.tags ?? [],
    semester: dto.semester ? `Kỳ ${dto.semester}` : undefined,
    major: dto.major ?? undefined,
    authorName: authorLabel,
    authorInitial: authorLabel.charAt(0).toUpperCase(),
    studentId: dto.author?.username ? `@${dto.author.username}` : "—",
    submittedAtLabel: formatRelativeTime(createdAt),
    timeLabel: formatRelativeTime(createdAt),
    status: uiStatus,
    resubmission: uiStatus === "pending" && Boolean(dto.moderatedAt),
    sortOrder: parseApiDate(createdAt)?.getTime() ?? 0,
    allowComments: true,
    moderation: mapModerationRecord(dto, uiStatus),
    images,
    attachments: [],
  };
}

/**
 * Map DTO bài viết moderation sang object dùng cho màn hình chi tiết.
 *
 * @param {Object} dto - Bài viết community từ API moderation.
 * @returns {ModerationPostUiItem} Dữ liệu chi tiết với `content` đầy đủ nếu API cung cấp.
 */
export function mapModerationPostDetail(dto) {
  const item = mapModerationPostListItem(dto);
  return {
    ...item,
    content: dto.content ?? item.excerpt,
  };
}
