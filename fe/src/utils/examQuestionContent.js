const HTML_IMAGE_PATTERN = /<img[^>]+src=["']([^"']+)["'][^>]*>/i;
const MARKDOWN_IMAGE_PATTERN = /!\[([^\]]*)\]\(([^)]+)\)/;

export function extractQuestionImageUrl(content = "") {
  const htmlMatch = String(content).match(HTML_IMAGE_PATTERN);
  if (htmlMatch?.[1]) {
    return htmlMatch[1].trim();
  }

  const markdownMatch = String(content).match(MARKDOWN_IMAGE_PATTERN);
  if (markdownMatch?.[2]) {
    return markdownMatch[2].trim();
  }

  return null;
}

export function stripQuestionImageMarkup(content = "") {
  return String(content)
    .replace(HTML_IMAGE_PATTERN, "")
    .replace(MARKDOWN_IMAGE_PATTERN, "")
    .replace(/<p>\s*<\/p>/gi, "")
    .trim();
}

export function appendQuestionImageToContent(content = "", imageUrl = "") {
  const trimmedUrl = String(imageUrl ?? "").trim();
  if (!trimmedUrl) {
    return String(content ?? "").trim();
  }

  const withoutImage = stripQuestionImageMarkup(content);
  const imageHtml = `<p><img src="${trimmedUrl}" alt="Minh họa câu hỏi" /></p>`;
  return withoutImage ? `${withoutImage}\n${imageHtml}` : imageHtml;
}

export function mergeQuestionImage(question, imageUrl) {
  const baseContent = String(
    question?.content ?? question?.Content ?? question?.text ?? "",
  ).trim();
  const resolvedUrl = imageUrl ?? question?.imageUrl ?? extractQuestionImageUrl(baseContent);

  return {
    ...question,
    imageUrl: resolvedUrl ?? null,
    content: appendQuestionImageToContent(baseContent, resolvedUrl),
  };
}
