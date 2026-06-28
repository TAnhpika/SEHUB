const INTERNAL_TAG_PREFIXES = ["showcase-", "seed-", "demo-"];

export function filterDisplayTags(tags = []) {
  return tags.filter((tag) => !INTERNAL_TAG_PREFIXES.some((prefix) => tag.startsWith(prefix)));
}

export function getPostExcerptText(post) {
  const source = post?.contentPreview ?? post?.body ?? post?.excerpt;
  return source ?? "";
}
