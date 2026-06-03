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
