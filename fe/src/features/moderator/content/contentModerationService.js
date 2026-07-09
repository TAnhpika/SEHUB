/**
 * @fileoverview Tầng dịch vụ API cho kiểm duyệt bài viết — gọi `adminApi` và map DTO sang model UI.
 *
 * Module này xử lý:
 * - Tải hàng đợi bài chờ duyệt (`Pending`) và lịch sử theo trạng thái.
 * - Duyệt / từ chối hàng loạt bài viết qua `moderatePost`.
 * - Cache số bài pending và phát sự kiện đồng bộ sidebar Moderator.
 *
 * Khi `VITE_USE_MOCK=true`, các hàm đếm pending trả về cache in-memory; logic mock chính nằm ở `contentModerationStore`.
 *
 * @module features/moderator/content/contentModerationService
 * @see {@link module:features/moderator/content/contentModerationStore} — hooks React bọc service + mock
 */

import * as adminApi from "@/api/adminApi";
import {
  mapModerationPostDetail,
  mapModerationPostListItem,
} from "@/api/contentModerationMapper";
import { DEFAULT_REJECT_REASON } from "@/features/moderator/content/contentModerationData";
import { ADMIN_API_PAGE_SIZE } from "@/features/admin/shared/adminPaginationConstants";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const HISTORY_STATUS_QUERY = {
  pending: "Pending",
  approved: "Published",
  rejected: "Rejected",
};

/** @type {number} Số bài pending được cache sau lần gọi API gần nhất. */
let cachedPendingCount = 0;

/**
 * Phát sự kiện custom để các component lắng nghe và làm mới danh sách kiểm duyệt.
 *
 * @returns {void}
 */
function notifyUpdated() {
  window.dispatchEvent(new CustomEvent("sehub-content-moderation-updated"));
}

/**
 * Lấy số bài chờ duyệt đã cache — dùng hiển thị badge sidebar mà không gọi API.
 *
 * @returns {number} Số bài `Pending` từ lần `refreshPendingContentCount` hoặc `loadModerationQueue` gần nhất.
 *
 * @example
 * const count = getCachedPendingContentCount();
 */
export function getCachedPendingContentCount() {
  return cachedPendingCount;
}

/**
 * Làm mới số bài pending từ API thống kê Moderator và phát sự kiện cập nhật stats.
 *
 * No-op về giá trị khi `USE_MOCK` — trả về cache hiện tại.
 *
 * @async
 * @returns {Promise<number>} Số bài chờ duyệt sau khi cập nhật cache.
 *
 * @throws {Error} Khi `adminApi.getModerationStats` thất bại (chế độ API thật).
 *
 * @example
 * await refreshPendingContentCount();
 */
export async function refreshPendingContentCount() {
  if (USE_MOCK) {
    return cachedPendingCount;
  }

  const stats = await adminApi.getModerationStats();
  cachedPendingCount = stats?.pendingPosts ?? 0;
  window.dispatchEvent(new CustomEvent("sehub-moderator-stats-updated"));
  return cachedPendingCount;
}

/**
 * Tải danh sách bài viết đang chờ duyệt (status `Pending`) từ API.
 *
 * Cập nhật `cachedPendingCount` và phát `sehub-content-moderation-updated`.
 *
 * @async
 * @param {Object} [options] - Tùy chọn truy vấn.
 * @param {string} [options.sort="newest"] - Thứ tự sắp xếp API.
 * @param {string} [options.search=""] - Từ khóa tìm kiếm (bỏ qua nếu rỗng).
 * @returns {Promise<Object[]>} Mảng bài đã map qua `mapModerationPostListItem`.
 *
 * @throws {Error} Khi `adminApi.listModerationPosts` thất bại.
 *
 * @example
 * const queue = await loadModerationQueue({ sort: 'newest', search: 'PRF192' });
 */
export async function loadModerationQueue({ sort = "newest", search = "" } = {}) {
  const data = await adminApi.listModerationPosts({
    status: "Pending",
    sort,
    search: search || undefined,
    page: 1,
    pageSize: ADMIN_API_PAGE_SIZE,
  });

  const items = (data?.items ?? []).map(mapModerationPostListItem);
  cachedPendingCount = data?.totalCount ?? items.length;
  notifyUpdated();
  return items;
}

/**
 * Tải lịch sử bài viết đã/đang kiểm duyệt theo tab trạng thái.
 *
 * Map tab UI (`pending`, `approved`, `rejected`, `all`) sang query status API (`Pending`, `Published`, `Rejected`, undefined).
 *
 * @async
 * @param {Object} [options] - Tùy chọn truy vấn.
 * @param {string} [options.status="all"] - Tab trạng thái trên UI.
 * @param {string} [options.sort="newest"] - Thứ tự sắp xếp.
 * @param {string} [options.search=""] - Từ khóa tìm kiếm.
 * @returns {Promise<Object[]>} Mảng bài đã map.
 *
 * @throws {Error} Khi API thất bại.
 *
 * @example
 * const approved = await loadModerationHistory({ status: 'approved' });
 */
export async function loadModerationHistory({ status = "all", sort = "newest", search = "" } = {}) {
  const queryStatus = HISTORY_STATUS_QUERY[status];
  const data = await adminApi.listModerationPosts({
    status: queryStatus,
    sort,
    search: search || undefined,
    page: 1,
    pageSize: ADMIN_API_PAGE_SIZE,
  });

  return (data?.items ?? []).map(mapModerationPostListItem);
}

/**
 * Tải chi tiết đầy đủ một bài viết kiểm duyệt theo ID.
 *
 * @async
 * @param {string} postId - Định danh bài viết.
 * @returns {Promise<Object>} Bài viết đã map qua `mapModerationPostDetail`.
 *
 * @throws {Error} Khi `adminApi.getModerationPost` thất bại hoặc không tìm thấy bài.
 *
 * @example
 * const detail = await loadModerationPostDetail('post-uuid-123');
 */
export async function loadModerationPostDetail(postId) {
  const dto = await adminApi.getModerationPost(postId);
  return mapModerationPostDetail(dto);
}

/**
 * Duyệt một hoặc nhiều bài viết — gọi API `moderatePost` với action `approve`.
 *
 * Sau khi thành công, làm mới pending count và phát sự kiện cập nhật.
 *
 * @async
 * @param {string[]} ids - Danh sách ID bài cần duyệt.
 * @param {string} [note="Đã duyệt — hiển thị trên feed cộng đồng."] - Ghi chú gửi lên API.
 * @returns {Promise<void>}
 *
 * @throws {Error} Khi bất kỳ lệnh duyệt nào thất bại.
 *
 * @example
 * await approveModerationPosts(['id-1', 'id-2']);
 */
export async function approveModerationPosts(ids, note = "Đã duyệt — hiển thị trên feed cộng đồng.") {
  await Promise.all(
    ids.map((id) =>
      adminApi.moderatePost(id, {
        action: "approve",
        note,
      }),
    ),
  );
  await refreshPendingContentCount();
  notifyUpdated();
}

/**
 * Từ chối một hoặc nhiều bài viết — gọi API `moderatePost` với action `reject`.
 *
 * @async
 * @param {string[]} ids - Danh sách ID bài cần từ chối.
 * @param {string} [reason] - Lý do từ chối; mặc định `DEFAULT_REJECT_REASON`.
 * @returns {Promise<void>}
 *
 * @throws {Error} Khi bất kỳ lệnh từ chối nào thất bại.
 *
 * @example
 * await rejectModerationPosts(['id-1'], 'Quảng cáo mua bán tài liệu.');
 */
export async function rejectModerationPosts(ids, reason = DEFAULT_REJECT_REASON) {
  await Promise.all(
    ids.map((id) =>
      adminApi.moderatePost(id, {
        action: "reject",
        note: reason,
      }),
    ),
  );
  await refreshPendingContentCount();
  notifyUpdated();
}

/**
 * Lấy tổng số bài theo từng trạng thái kiểm duyệt — dùng metric cards trên lịch sử (API mode).
 *
 * Gọi song song 4 request `listModerationPosts` với `pageSize: 1` để chỉ lấy `totalCount`.
 *
 * @async
 * @returns {Promise<{ pending: number, approved: number, rejected: number, all: number }>}
 *
 * @throws {Error} Khi bất kỳ request đếm nào thất bại.
 *
 * @example
 * const counts = await loadModerationCounts();
 */
export async function loadModerationCounts() {
  const [pending, approved, rejected, all] = await Promise.all([
    adminApi.listModerationPosts({ status: "Pending", page: 1, pageSize: 1 }),
    adminApi.listModerationPosts({ status: "Published", page: 1, pageSize: 1 }),
    adminApi.listModerationPosts({ status: "Rejected", page: 1, pageSize: 1 }),
    adminApi.listModerationPosts({ page: 1, pageSize: 1 }),
  ]);

  return {
    pending: pending?.totalCount ?? 0,
    approved: approved?.totalCount ?? 0,
    rejected: rejected?.totalCount ?? 0,
    all: all?.totalCount ?? 0,
  };
}

/**
 * Cờ bật chế độ mock kiểm duyệt nội dung — đọc từ `import.meta.env.VITE_USE_MOCK`.
 *
 * @constant {boolean}
 * @readonly
 */
export { USE_MOCK as CONTENT_MODERATION_USE_MOCK };
