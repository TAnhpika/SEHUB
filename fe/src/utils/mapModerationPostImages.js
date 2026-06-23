import { resolveAssetUrl } from "@/api/assetUrl";

/**
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
        alt: index === 0 ? "Ảnh bìa" : `Ảnh trong bài ${index}`,
        caption: index > 0 ? `Ảnh ${index}` : undefined,
      };
    })
    .filter(Boolean);

  if (mapped.length === 0) {
    return { coverImage: null, inlineImages: [] };
  }

  return {
    coverImage: { url: mapped[0].url, alt: mapped[0].alt },
    inlineImages: mapped.slice(1).map((image) => ({
      url: image.url,
      caption: image.caption,
    })),
  };
}
