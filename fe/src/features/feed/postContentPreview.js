const HTML_IMG_SRC = /<img[^>]+src=["']([^"']+)["']/i;
const MARKDOWN_IMG = /!\[[^\]]*\]\(([^)]+)\)/;

export function extractFirstImageUrl(content) {
  if (!content?.trim()) {
    return null;
  }

  const htmlMatch = content.match(HTML_IMG_SRC);
  if (htmlMatch?.[1]) {
    return htmlMatch[1].trim();
  }

  const markdownMatch = content.match(MARKDOWN_IMG);
  if (markdownMatch?.[1]) {
    return markdownMatch[1].trim();
  }

  return null;
}

export function resolvePostPreviewImage(post) {
  return (
    post?.images?.[0]?.url ??
    post?.previewImageUrl ??
    post?.coverImageUrl ??
    extractFirstImageUrl(post?.body) ??
    extractFirstImageUrl(post?.excerpt) ??
    null
  );
}
