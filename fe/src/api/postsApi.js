import { apiRequest } from "./httpClient";

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "all") {
      search.set(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function listPosts(params = {}) {
  return apiRequest(`/api/v1/posts${buildQuery(params)}`, { auth: false });
}

export function getFeaturedPosts() {
  return apiRequest("/api/v1/posts/featured", { auth: false });
}

export function getPost(id) {
  return apiRequest(`/api/v1/posts/${id}`, { auth: false });
}

export function createPost(body) {
  return apiRequest("/api/v1/posts", { method: "POST", body });
}

export function updatePost(id, body) {
  return apiRequest(`/api/v1/posts/${id}`, { method: "PUT", body });
}

export function deletePost(id) {
  return apiRequest(`/api/v1/posts/${id}`, { method: "DELETE" });
}

export function likePost(id) {
  return apiRequest(`/api/v1/posts/${id}/like`, { method: "POST" });
}

export function unlikePost(id) {
  return apiRequest(`/api/v1/posts/${id}/like`, { method: "DELETE" });
}

export function listComments(postId, params = {}) {
  return apiRequest(`/api/v1/posts/${postId}/comments${buildQuery(params)}`, { auth: false });
}

export function createComment(postId, body) {
  return apiRequest(`/api/v1/posts/${postId}/comments`, { method: "POST", body });
}

export function deleteComment(postId, commentId) {
  return apiRequest(`/api/v1/posts/${postId}/comments/${commentId}`, { method: "DELETE" });
}

export function reportPost(postId, body) {
  return apiRequest(`/api/v1/posts/${postId}/report`, { method: "POST", body });
}

export function featurePost(id, body) {
  return apiRequest(`/api/v1/posts/${id}/feature`, { method: "PATCH", body });
}
