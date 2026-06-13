import * as adminApi from "@/api/adminApi";
import {
  mapModerationPostDetail,
  mapModerationPostListItem,
} from "@/api/contentModerationMapper";
import { DEFAULT_REJECT_REASON } from "@/features/moderator/content/contentModerationData";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const HISTORY_STATUS_QUERY = {
  pending: "Pending",
  approved: "Published",
  rejected: "Rejected",
};

let cachedPendingCount = 0;

function notifyUpdated() {
  window.dispatchEvent(new CustomEvent("sehub-content-moderation-updated"));
}

export function getCachedPendingContentCount() {
  return cachedPendingCount;
}

export async function refreshPendingContentCount() {
  if (USE_MOCK) {
    return cachedPendingCount;
  }

  const stats = await adminApi.getModerationStats();
  cachedPendingCount = stats?.pendingPosts ?? 0;
  notifyUpdated();
  return cachedPendingCount;
}

export async function loadModerationQueue({ sort = "newest" } = {}) {
  const data = await adminApi.listModerationPosts({
    status: "Pending",
    sort,
    page: 1,
    pageSize: 100,
  });

  const items = (data?.items ?? []).map(mapModerationPostListItem);
  cachedPendingCount = data?.totalCount ?? items.length;
  notifyUpdated();
  return items;
}

export async function loadModerationHistory({ status = "all", sort = "newest" } = {}) {
  const queryStatus = HISTORY_STATUS_QUERY[status];
  const data = await adminApi.listModerationPosts({
    status: queryStatus,
    sort,
    page: 1,
    pageSize: 200,
  });

  return (data?.items ?? []).map(mapModerationPostListItem);
}

export async function loadModerationPostDetail(postId) {
  const dto = await adminApi.getModerationPost(postId);
  return mapModerationPostDetail(dto);
}

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

export { USE_MOCK as CONTENT_MODERATION_USE_MOCK };
