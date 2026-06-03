export function isOwnPost(post, user) {
  return Boolean(user?.username && post?.author?.username === user.username);
}
