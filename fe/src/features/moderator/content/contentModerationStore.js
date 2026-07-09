/**
 * @fileoverview Store React hooks cho kiểm duyệt bài viết — kết hợp API thật và mock localStorage.
 *
 * Module này cung cấp:
 * - `useContentModerationQueue` — hàng đợi duyệt với approve/reject/reset.
 * - `useContentModerationHistory` — lịch sử theo tab trạng thái.
 * - `useContentModerationDetail` — chi tiết một bài theo ID.
 * - `getPendingContentCount` — đếm bài pending cho badge sidebar.
 *
 * Chế độ mock (`CONTENT_MODERATION_USE_MOCK`) lưu state trong `localStorage` key `sehub-content-moderation-v1`.
 *
 * @module features/moderator/content/contentModerationStore
 * @see {@link module:features/moderator/content/contentModerationService} — tầng API
 * @see {@link module:features/moderator/content/contentModerationData} — dữ liệu mock mặc định
 */

import { useCallback, useEffect, useState } from "react";
import {
  approveModerationPosts,
  CONTENT_MODERATION_USE_MOCK,
  getCachedPendingContentCount,
  loadModerationHistory,
  loadModerationPostDetail,
  loadModerationQueue,
  refreshPendingContentCount,
  rejectModerationPosts,
} from "@/features/moderator/content/contentModerationService";
import {
  buildDefaultContentItems,
  DEFAULT_REJECT_REASON,
} from "@/features/moderator/content/contentModerationData";

/** @constant {string} Khóa localStorage lưu danh sách bài mock kiểm duyệt. */
const STORAGE_KEY = "sehub-content-moderation-v1";

/**
 * Thông tin Moderator mặc định ghi vào bản ghi `moderation` khi duyệt/từ chối mock.
 *
 * @constant {{ moderatorName: string, moderatorId: string }}
 * @readonly
 */
const MODERATOR_ACTOR = {
  moderatorName: "Nguyễn Mod SEHUB",
  moderatorId: "MOD001",
};

/**
 * Định dạng thời điểm hành động kiểm duyệt theo locale `vi-VN`.
 *
 * @returns {string} Chuỗi ngày giờ hiển thị (ví dụ `09/07/2026, 16:03`).
 */
function formatActionTime() {
  return new Date().toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Đọc danh sách bài mock từ localStorage; fallback `buildDefaultContentItems()` nếu trống hoặc lỗi parse.
 *
 * @returns {Object[]} Mảng bài viết kiểm duyệt.
 */
function loadMockContentItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore corrupt storage */
  }
  return buildDefaultContentItems();
}

/**
 * Ghi danh sách bài mock vào localStorage.
 *
 * @param {Object[]} items - Mảng bài cần lưu.
 * @returns {void}
 */
function saveMockContentItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/**
 * Cập nhật đồng loạt các bài có ID trong `ids` bằng object `patch` (nội bộ mock).
 *
 * @param {Object[]} items - Mảng nguồn.
 * @param {string[]} ids - ID cần patch.
 * @param {Object} patch - Trường ghi đè lên từng bài khớp.
 * @returns {Object[]} Mảng mới (immutable).
 */
function patchMockItems(items, ids, patch) {
  const idSet = new Set(ids);
  return items.map((item) => (idSet.has(item.id) ? { ...item, ...patch } : item));
}

/**
 * Đánh dấu mock approve — đặt `status: "approved"` và ghi `moderation` với thông tin Moderator.
 *
 * @param {Object[]} items - Mảng nguồn.
 * @param {string[]} ids - ID bài duyệt.
 * @param {{ moderatorName: string, moderatorId: string }} [actor=MODERATOR_ACTOR] - Người duyệt.
 * @returns {Object[]} Mảng sau khi duyệt.
 */
function approveMockItems(items, ids, actor = MODERATOR_ACTOR) {
  const actionAtLabel = formatActionTime();
  return patchMockItems(items, ids, {
    status: "approved",
    moderation: {
      moderatorName: actor.moderatorName,
      moderatorId: actor.moderatorId,
      actionAtLabel,
      note: "Đã duyệt — hiển thị trên feed cộng đồng.",
    },
  });
}

/**
 * Đánh dấu mock reject — đặt `status: "rejected"` và ghi lý do + gợi ý gửi lại.
 *
 * @param {Object[]} items - Mảng nguồn.
 * @param {string[]} ids - ID bài từ chối.
 * @param {string} [reason=DEFAULT_REJECT_REASON] - Lý do từ chối.
 * @param {{ moderatorName: string, moderatorId: string }} [actor=MODERATOR_ACTOR] - Người từ chối.
 * @returns {Object[]} Mảng sau khi từ chối.
 */
function rejectMockItems(items, ids, reason = DEFAULT_REJECT_REASON, actor = MODERATOR_ACTOR) {
  const actionAtLabel = formatActionTime();
  return patchMockItems(items, ids, {
    status: "rejected",
    moderation: {
      moderatorName: actor.moderatorName,
      moderatorId: actor.moderatorId,
      actionAtLabel,
      reason,
      resubmitHint: "Tác giả có thể chỉnh sửa bài Rejected rồi gửi duyệt lại (Pending).",
    },
  });
}

/**
 * Phát sự kiện đồng bộ kiểm duyệt và thống kê Moderator (mock và API).
 *
 * @returns {void}
 */
function notifyUpdated() {
  window.dispatchEvent(new CustomEvent("sehub-content-moderation-updated"));
  window.dispatchEvent(new CustomEvent("sehub-moderator-stats-updated"));
}

/**
 * Lấy số bài đang chờ duyệt — đếm từ mock localStorage hoặc cache API.
 *
 * @returns {number} Số bài `status === "pending"`.
 *
 * @example
 * const pending = getPendingContentCount();
 */
export function getPendingContentCount() {
  if (CONTENT_MODERATION_USE_MOCK) {
    return loadMockContentItems().filter((item) => item.status === "pending").length;
  }
  return getCachedPendingContentCount();
}

/**
 * Hook quản lý hàng đợi duyệt bài viết — tải, lọc, duyệt, từ chối và reset.
 *
 * **Luồng dữ liệu:**
 * - `sort` / `search` thay đổi → `refresh` → `loadModerationQueue` (API) hoặc `loadMockContentItems` (mock).
 * - `approveItems` / `rejectItems` → cập nhật API hoặc localStorage mock → `refresh`.
 *
 * @returns {{
 *   items: Object[],
 *   loading: boolean,
 *   error: string|null,
 *   sort: string,
 *   setSort: import('react').Dispatch<import('react').SetStateAction<string>>,
 *   search: string,
 *   setSearch: import('react').Dispatch<import('react').SetStateAction<string>>,
 *   refresh: (nextSort?: string, nextSearch?: string) => Promise<Object[]>,
 *   approveItems: (ids: string[]) => Promise<void>,
 *   rejectItems: (ids: string[], reason?: string) => Promise<void>,
 *   resetItems: () => Promise<void>
 * }} State và handlers cho `ContentModerationPage`.
 *
 * @example
 * const { items, approveItems, rejectItems } = useContentModerationQueue();
 */
export function useContentModerationQueue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");

  const refresh = useCallback(async (nextSort = sort, nextSearch = search) => {
    setLoading(true);
    setError(null);
    try {
      if (CONTENT_MODERATION_USE_MOCK) {
        const mockItems = loadMockContentItems();
        setItems(mockItems);
        notifyUpdated();
        return mockItems;
      }

      const data = await loadModerationQueue({ sort: nextSort, search: nextSearch });
      setItems(data);
      return data;
    } catch (err) {
      setError(err.message ?? "Không tải được hàng đợi duyệt bài.");
      setItems([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [sort, search]);

  useEffect(() => {
    refresh(sort, search);
  }, [sort, search, refresh]);

  useEffect(() => {
    if (CONTENT_MODERATION_USE_MOCK) {
      function syncFromStorage() {
        setItems(loadMockContentItems());
      }

      window.addEventListener("sehub-content-moderation-updated", syncFromStorage);
      window.addEventListener("storage", syncFromStorage);
      return () => {
        window.removeEventListener("sehub-content-moderation-updated", syncFromStorage);
        window.removeEventListener("storage", syncFromStorage);
      };
    }

    refreshPendingContentCount().catch(() => {});
    return undefined;
  }, [refresh]);

  const approveItems = useCallback(
    async (ids) => {
      if (CONTENT_MODERATION_USE_MOCK) {
        const next = approveMockItems(loadMockContentItems(), ids);
        saveMockContentItems(next);
        setItems(next);
        notifyUpdated();
        return;
      }

      await approveModerationPosts(ids);
      await refresh(sort, search);
    },
    [refresh, sort, search],
  );

  const rejectItems = useCallback(
    async (ids, reason) => {
      if (CONTENT_MODERATION_USE_MOCK) {
        const next = rejectMockItems(loadMockContentItems(), ids, reason);
        saveMockContentItems(next);
        setItems(next);
        notifyUpdated();
        return;
      }

      await rejectModerationPosts(ids, reason);
      await refresh(sort, search);
    },
    [refresh, sort, search],
  );

  const resetItems = useCallback(async () => {
    if (CONTENT_MODERATION_USE_MOCK) {
      const next = buildDefaultContentItems();
      saveMockContentItems(next);
      setItems(next);
      notifyUpdated();
      return;
    }

    await refresh(sort, search);
  }, [refresh, sort, search]);

  return {
    items,
    loading,
    error,
    sort,
    setSort,
    search,
    setSearch,
    refresh,
    approveItems,
    rejectItems,
    resetItems,
  };
}

/**
 * Hook tải lịch sử kiểm duyệt bài viết theo tab trạng thái, sort và tìm kiếm.
 *
 * Mock mode: lọc client-side qua `filterContentItems` trên trang; hook chỉ trả toàn bộ items từ storage.
 * API mode: gọi `loadModerationHistory` với `status` map sang query backend.
 *
 * @param {Object} [options] - Tùy chọn truy vấn.
 * @param {string} [options.status="all"] - Tab: `pending` | `approved` | `rejected` | `all`.
 * @param {string} [options.sort="newest"] - Thứ tự sắp xếp.
 * @param {string} [options.search=""] - Từ khóa tìm kiếm.
 * @returns {{
 *   items: Object[],
 *   loading: boolean,
 *   error: string|null,
 *   refresh: () => Promise<void>
 * }} State lịch sử cho `ContentModerationHistoryPage`.
 *
 * @example
 * const { items, loading } = useContentModerationHistory({ status: 'approved', sort: 'newest' });
 */
export function useContentModerationHistory({ status = "all", sort = "newest", search = "" } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (CONTENT_MODERATION_USE_MOCK) {
        setItems(loadMockContentItems());
        return;
      }

      const data = await loadModerationHistory({ status, sort, search });
      setItems(data);
    } catch (err) {
      setError(err.message ?? "Không tải được lịch sử duyệt bài.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [status, sort, search]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (CONTENT_MODERATION_USE_MOCK) {
      function syncFromStorage() {
        setItems(loadMockContentItems());
      }

      window.addEventListener("sehub-content-moderation-updated", syncFromStorage);
      window.addEventListener("storage", syncFromStorage);
      return () => {
        window.removeEventListener("sehub-content-moderation-updated", syncFromStorage);
        window.removeEventListener("storage", syncFromStorage);
      };
    }

    return undefined;
  }, []);

  return { items, loading, error, refresh };
}

/**
 * Hook tải chi tiết một bài viết kiểm duyệt theo `postId`.
 *
 * Hủy request khi `postId` đổi hoặc component unmount. Khi `postId` là `null`, reset `item` về `null`.
 *
 * @param {string|null} postId - ID bài cần xem; `null` khi chưa chọn.
 * @returns {{
 *   item: Object|null,
 *   loading: boolean,
 *   error: string|null
 * }} Chi tiết bài cho panel bên phải.
 *
 * @example
 * const { item, loading } = useContentModerationDetail(focusedId);
 */
export function useContentModerationDetail(postId) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!postId) {
      setItem(null);
      setError(null);
      return undefined;
    }

    let cancelled = false;

    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        if (CONTENT_MODERATION_USE_MOCK) {
          const mockItem = loadMockContentItems().find((entry) => entry.id === postId) ?? null;
          if (!cancelled) setItem(mockItem);
          return;
        }

        const detail = await loadModerationPostDetail(postId);
        if (!cancelled) setItem(detail);
      } catch (err) {
        if (!cancelled) {
          setError(err.message ?? "Không tải được chi tiết bài viết.");
          setItem(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  return { item, loading, error };
}

/**
 * Hook legacy — bọc `useContentModerationQueue` chỉ expose subset API cũ.
 *
 * @deprecated Dùng `useContentModerationQueue` hoặc `useContentModerationHistory` thay thế.
 * @returns {{
 *   items: Object[],
 *   approveItems: (ids: string[]) => Promise<void>,
 *   rejectItems: (ids: string[], reason?: string) => Promise<void>,
 *   resetItems: () => Promise<void>
 * }}
 */
export function useContentModerationItems() {
  const queue = useContentModerationQueue();
  return {
    items: queue.items,
    approveItems: queue.approveItems,
    rejectItems: queue.rejectItems,
    resetItems: queue.resetItems,
  };
}
