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

const STORAGE_KEY = "sehub-content-moderation-v1";
const MODERATOR_ACTOR = {
  moderatorName: "Nguyễn Mod SEHUB",
  moderatorId: "MOD001",
};

function formatActionTime() {
  return new Date().toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

function saveMockContentItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function patchMockItems(items, ids, patch) {
  const idSet = new Set(ids);
  return items.map((item) => (idSet.has(item.id) ? { ...item, ...patch } : item));
}

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

function notifyUpdated() {
  window.dispatchEvent(new CustomEvent("sehub-content-moderation-updated"));
  window.dispatchEvent(new CustomEvent("sehub-moderator-stats-updated"));
}

export function getPendingContentCount() {
  if (CONTENT_MODERATION_USE_MOCK) {
    return loadMockContentItems().filter((item) => item.status === "pending").length;
  }
  return getCachedPendingContentCount();
}

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

/** @deprecated — dùng useContentModerationQueue / useContentModerationHistory */
export function useContentModerationItems() {
  const queue = useContentModerationQueue();
  return {
    items: queue.items,
    approveItems: queue.approveItems,
    rejectItems: queue.rejectItems,
    resetItems: queue.resetItems,
  };
}
