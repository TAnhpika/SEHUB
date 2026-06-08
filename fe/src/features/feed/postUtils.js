export function formatDisplayTitle(title = "") {
  return title
    .replace(/^#+\s*/, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .trim();
}

export function isOwnPost(post, user) {
  return Boolean(user?.username && post?.author?.username === user.username);
}

export function isOwnComment(comment, user) {
  if (!user || !comment?.author) return false;
  if (comment.author.username) {
    return comment.author.username === user.username;
  }
  return comment.author.name === user.displayName;
}

export function getPostShareUrl(postId) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/home/posts/${postId}`;
}

export function parsePostId(value) {
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function copyPostLink(postId) {
  const url = getPostShareUrl(postId);
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return url;
  }

  const textarea = document.createElement("textarea");
  textarea.value = url;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  return url;
}
