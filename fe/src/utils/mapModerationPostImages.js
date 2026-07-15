import { resolveAssetUrl } from "@/api/assetUrl";

/**
 * Map ảnh moderation: tất cả ảnh vào gallery (inlineImages), ảnh đầu cũng làm cover cho thumbnail.
 *
 * @param {Array<{ id?: string, sortOrder?: number, imagePath?: string, url?: string }>} images
 */
export function mapModerationPostImages(images = []) {
  const sorted = [...images].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const mapped = sorted
    .map((image, index) => {
      const url = resolveAssetUrl(image.imagePath ?? image.url);
      if (!url) return null;
      return {
        id: image.id ?? `img-${index}`,
        url,
        alt: `Ảnh ${index + 1}`,
        caption: `Ảnh ${index + 1}`,
      };
    })
    .filter(Boolean);

  if (mapped.length === 0) {
    return { coverImage: null, inlineImages: [] };
  }

  return {
    coverImage: { url: mapped[0].url, alt: mapped[0].alt },
    inlineImages: mapped.map((image) => ({
      url: image.url,
      caption: image.caption,
    })),
  };
}
