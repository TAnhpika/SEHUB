import { useCallback, useEffect, useState } from "react";
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
  const [items, setItemsState] = useState(() => loadContentItems());

  const persist = useCallback((next) => {
    const resolved = typeof next === "function" ? next(loadContentItems()) : next;
    setItemsState(resolved);
    saveContentItems(resolved);
    window.dispatchEvent(new CustomEvent("sehub-content-moderation-updated"));
  }, []);

  useEffect(() => {
    function syncFromStorage() {
      setItemsState(loadContentItems());
    }

    window.addEventListener("sehub-content-moderation-updated", syncFromStorage);
    window.addEventListener("storage", syncFromStorage);
    return () => {
      window.removeEventListener("sehub-content-moderation-updated", syncFromStorage);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  const approveItems = useCallback(
    (ids) => {
      persist((prev) => approveContentItems(prev, ids));
    },
    [persist],
  );

  const rejectItems = useCallback(
    (ids, reason) => {
      persist((prev) => rejectContentItems(prev, ids, reason));
    },
    [persist],
  );

  const resetItems = useCallback(() => {
    persist(buildDefaultContentItems());
  }, [persist]);

  return { items, approveItems, rejectItems, resetItems };
}
