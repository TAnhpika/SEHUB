import * as followApi from "@/api/followApi";
import { mapFollowListItem } from "@/api/usersMapper";
import { FOLLOW_PAGE_SIZE } from "./followListConstants";

function mapFollowPage(page) {
  const items = (page.items ?? []).map(mapFollowListItem);
  return {
    items,
    page: page.page ?? 1,
    pageSize: page.pageSize ?? items.length,
    totalCount: page.totalCount ?? items.length,
    hasNextPage: Boolean(page.hasNextPage),
  };
}

export function loadFollowersPage(userId, page = 1) {
  return followApi
    .getFollowers(userId, { page, pageSize: FOLLOW_PAGE_SIZE })
    .then(mapFollowPage);
}

export function loadFollowingPage(userId, page = 1) {
  return followApi
    .getFollowing(userId, { page, pageSize: FOLLOW_PAGE_SIZE })
    .then(mapFollowPage);
}
