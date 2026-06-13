import { useCallback, useEffect, useState } from "react";
import * as adminApi from "@/api/adminApi";
import {
  buildDefaultContentItems,
  DEFAULT_REJECT_REASON,
  loadModerationContentItems,
} from "@/features/moderator/content/contentModerationData";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const STORAGE_KEY = "sehub-content-moderation-v1";
const UPDATE_EVENT = "sehub-content-moderation-updated";
const STATS_EVENT = "sehub-moderator-stats-updated";

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

function notifyUpdated() {
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  window.dispatchEvent(new CustomEvent(STATS_EVENT));
}

export function loadContentItems() {
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

export function saveContentItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getPendingContentCount() {
  if (!USE_MOCK) return 0;
  return loadContentItems().filter((item) => item.status === "pending").length;
}

function patchItems(items, ids, patch) {
  const idSet = new Set(ids);
  return items.map((item) => (idSet.has(item.id) ? { ...item, ...patch } : item));
}

export function approveContentItems(items, ids, actor = MODERATOR_ACTOR) {
  const actionAtLabel = formatActionTime();
  return patchItems(items, ids, {
    status: "approved",
    moderation: {
      moderatorName: actor.moderatorName,
      moderatorId: actor.moderatorId,
      actionAtLabel,
      note: "Đã duyệt — hiển thị trên feed cộng đồng.",
    },
  });
}

export function rejectContentItems(items, ids, reason = DEFAULT_REJECT_REASON, actor = MODERATOR_ACTOR) {
  const actionAtLabel = formatActionTime();
  return patchItems(items, ids, {
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

export function useContentModerationItems() {
  const [items, setItemsState] = useState(() => (USE_MOCK ? loadContentItems() : []));
  const [loading, setLoading] = useState(!USE_MOCK);
  const [error, setError] = useState(null);

  const persist = useCallback((next) => {
    const resolved = typeof next === "function" ? next(loadContentItems()) : next;
    setItemsState(resolved);
    saveContentItems(resolved);
    notifyUpdated();
  }, []);

  const reload = useCallback(async () => {
    if (USE_MOCK) {
      setItemsState(loadContentItems());
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const next = await loadModerationContentItems();
      setItemsState(next);
    } catch (err) {
      setError(err.message ?? "Không tải được danh sách bài viết.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (USE_MOCK) {
      function syncFromStorage() {
        setItemsState(loadContentItems());
      }

      window.addEventListener(UPDATE_EVENT, syncFromStorage);
      window.addEventListener("storage", syncFromStorage);
      return () => {
        window.removeEventListener(UPDATE_EVENT, syncFromStorage);
        window.removeEventListener("storage", syncFromStorage);
      };
    }

    function onExternalUpdate() {
      reload();
    }

    window.addEventListener(UPDATE_EVENT, onExternalUpdate);
    return () => window.removeEventListener(UPDATE_EVENT, onExternalUpdate);
  }, [reload]);

  const approveItems = useCallback(
    async (ids) => {
      if (USE_MOCK) {
        persist((prev) => approveContentItems(prev, ids));
        return;
      }

      for (const id of ids) {
        await adminApi.moderatePost(id, {
          action: "approve",
          note: "Đã duyệt — hiển thị trên feed cộng đồng.",
        });
      }
      await reload();
      notifyUpdated();
    },
    [persist, reload],
  );

  const rejectItems = useCallback(
    async (ids, reason = DEFAULT_REJECT_REASON) => {
      if (USE_MOCK) {
        persist((prev) => rejectContentItems(prev, ids, reason));
        return;
      }

      for (const id of ids) {
        await adminApi.moderatePost(id, { action: "reject", note: reason });
      }
      await reload();
      notifyUpdated();
    },
    [persist, reload],
  );

  const resetItems = useCallback(() => {
    if (USE_MOCK) {
      persist(buildDefaultContentItems());
      return;
    }
    reload();
  }, [persist, reload]);

  return { items, loading, error, approveItems, rejectItems, resetItems, reload };
}
