import * as friendsApi from "@/api/friendsApi";

export async function loadIncomingFriendRequests() {
  return friendsApi.getFriendRequests("incoming");
}

export async function loadOutgoingFriendRequests() {
  return friendsApi.getFriendRequests("outgoing");
}

import { mapUserSearchResult } from "@/api/usersMapper";

export async function searchMembers(query, { page = 1, pageSize = 20 } = {}) {
  const trimmed = query.trim();
  if (!trimmed) {
    return { items: [], totalCount: 0, page: 1, pageSize };
  }

  const data = await usersApi.searchUsers(trimmed, { page, pageSize });

  return {
    items: (data.items ?? []).map(mapUserSearchResult),
    totalCount: data.totalCount ?? 0,
    page: data.page ?? page,
    pageSize: data.pageSize ?? pageSize,
    hasNextPage: data.hasNextPage ?? false,
  };
}
