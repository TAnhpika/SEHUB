import { apiRequest, apiUploadRequest } from "./httpClient";

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
  return apiRequest(`/api/v1/posts${buildQuery(params)}`);
}

export function getFeaturedPosts() {
  return apiRequest("/api/v1/posts/featured", { auth: false });
}

export function getPost(id) {
  // Send auth when logged in so authors/moderators can open Pending posts.
  return apiRequest(`/api/v1/posts/${id}`);
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

export function uploadPostImages(postId, files) {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });
  return apiUploadRequest(`/api/v1/posts/${postId}/images`, formData);
}

export function featurePost(id, body) {
  return apiRequest(`/api/v1/posts/${id}/feature`, { method: "PATCH", body });
}

export function pinPost(id, body) {
  return apiRequest(`/api/v1/posts/${id}/pin`, { method: "PATCH", body });
}

export function uploadPostContentImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  return apiUploadRequest("/api/v1/posts/upload-image", formData);
}

export function uploadPostCover(file) {
  const formData = new FormData();
  formData.append("file", file);
  return apiUploadRequest("/api/v1/posts/upload-cover", formData);
}
