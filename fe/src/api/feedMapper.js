import { formatRelativeTimeFromApi, parseApiDate } from "@/utils/parseApiDate";
import { resolveAssetUrl } from "@/api/assetUrl";

function mapPostImage(dto) {
  return {
    id: dto.id,
    sortOrder: dto.sortOrder ?? 0,
    url: resolveAssetUrl(dto.imagePath),
  };
}

function formatRelativeTime(dateStr) {
  return formatRelativeTimeFromApi(dateStr);
}

function formatPublishedAt(dateStr) {
  const date = parseApiDate(dateStr);
  if (!date) return "";
  return `${date.getDate()} tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
}

export function formatCommentTime(dateStr) {
  const date = parseApiDate(dateStr);
  if (!date) return "";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

function mapAuthor(dto) {
  if (!dto) {
    return { username: "unknown", name: "Unknown", initial: "?" };
  }

  const displayName = dto.displayName?.trim() || dto.username || "User";

  return {
    id: dto.id,
    username: dto.username,
    name: displayName,
    displayName,
    initial: displayName.charAt(0).toUpperCase(),
  };
}

export function mapPostListItem(dto) {
  return {
    id: dto.id,
    author: mapAuthor(dto.author),
    title: dto.title,
    excerpt: dto.excerpt,
    body: dto.excerpt,
    tags: dto.tags ?? [],
    timeAgo: formatRelativeTime(dto.createdAt),
    publishedAt: formatPublishedAt(dto.createdAt),
    likes: dto.likeCount ?? 0,
    comments: dto.commentCount ?? 0,
    views: dto.viewCount ?? 0,
    isPinned: dto.isPinned ?? false,
    isFeatured: dto.isFeatured ?? false,
    coverImageUrl: resolveAssetUrl(dto.coverImageUrl),
    isLiked: dto.isLiked ?? false,
    images: (dto.images ?? []).map(mapPostImage),
    commentsList: [],
  };
}

export function mapPostDetail(dto, commentsList = []) {
  const listItem = mapPostListItem(dto);

  return {
    ...listItem,
    body: dto.content ?? listItem.excerpt,
    excerpt: dto.excerpt || dto.content?.slice(0, 200) || "",
    views: dto.viewCount ?? listItem.views,
    likes: dto.likeCount ?? listItem.likes,
    comments: dto.commentCount ?? listItem.comments,
    isLiked: dto.isLiked ?? false,
    commentsList,
    status: dto.status,
    images: (dto.images ?? []).map(mapPostImage),
  };
}

export function mapComment(dto) {
  return {
    id: dto.id,
    author: mapAuthor(dto.author),
    time: formatCommentTime(dto.createdAt),
    content: dto.content,
    parentCommentId: dto.parentCommentId,
    replies: dto.replies?.map(mapComment) ?? [],
  };
}
