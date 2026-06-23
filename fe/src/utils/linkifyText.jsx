const URL_PATTERN = /(https?:\/\/[^\s<]+[^\s<.,;:!?")\]}])/gi;

/**
 * Chuyển URL trong văn bản thành thẻ liên kết an toàn (mở tab mới).
 * @param {string} text
 * @returns {import('react').ReactNode[]}
 */
export function linkifyText(text) {
  if (!text) return [];

  const nodes = [];
  let lastIndex = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const url = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }

    nodes.push(
      <a key={`${index}-${url}`} href={url} target="_blank" rel="noopener noreferrer">
        {url}
      </a>,
    );

    lastIndex = index + url.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}
