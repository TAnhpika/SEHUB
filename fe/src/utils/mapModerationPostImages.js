import { resolveAssetUrl } from "@/api/assetUrl";

/**
 * Map ảnh moderation sang mảng dùng cho UI (list + panel chi tiết).
 *
 * @param {Array<{ id?: string, sortOrder?: number, imagePath?: string, url?: string }>} images
 * @returns {Array<{ id: string, url: string, alt: string, caption?: string }>}
 */
export function mapModerationPostImages(images = []) {
  const sorted = [...images].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const mapped = [];
  for (const image of sorted) {
    const url = resolveAssetUrl(image.imagePath ?? image.url);
    if (!url) continue;
    const index = mapped.length;
    mapped.push({
      id: image.id ?? `img-${index}`,
      url,
      alt: `Ảnh ${index + 1}`,
      caption: `Ảnh ${index + 1}`,
    });
  }
  return mapped;
}
