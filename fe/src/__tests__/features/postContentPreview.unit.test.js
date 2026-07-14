import { describe, expect, it } from "vitest";
import { resolvePostPreviewImage } from "@/features/feed/postContentPreview";

describe("resolvePostPreviewImage", () => {
  it("prefers gallery images[0] over content scrape", () => {
    const url = resolvePostPreviewImage({
      images: [{ id: "1", url: "https://cdn.example/gallery.jpg" }],
      previewImageUrl: "https://cdn.example/preview.jpg",
      coverImageUrl: "https://cdn.example/cover.jpg",
      body: '<p>x</p><img src="https://cdn.example/legacy.jpg" />',
    });

    expect(url).toBe("https://cdn.example/gallery.jpg");
  });

  it("falls back to preview/cover then legacy content", () => {
    expect(
      resolvePostPreviewImage({
        previewImageUrl: "https://cdn.example/preview.jpg",
        body: '<img src="https://cdn.example/legacy.jpg" />',
      }),
    ).toBe("https://cdn.example/preview.jpg");

    expect(
      resolvePostPreviewImage({
        body: '<img src="https://cdn.example/legacy.jpg" />',
      }),
    ).toBe("https://cdn.example/legacy.jpg");
  });
});
