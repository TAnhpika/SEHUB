import { describe, expect, it } from "vitest";
import { resolvePostPreviewImage } from "@/features/feed/postContentPreview";

describe("resolvePostPreviewImage", () => {
  it("prefers gallery images[0]", () => {
    const url = resolvePostPreviewImage({
      images: [{ url: "https://cdn.example/gallery0.jpg" }],
      body: '<img src="https://cdn.example/legacy.jpg" />',
      excerpt: "no images here",
    });
    expect(url).toBe("https://cdn.example/gallery0.jpg");
  });

  it("falls back to body scrape when gallery empty", () => {
    expect(
      resolvePostPreviewImage({
        images: [],
        body: '<p>hi</p><img src="https://cdn.example/from-body.jpg" alt="x">',
      }),
    ).toBe("https://cdn.example/from-body.jpg");
  });

  it("falls back to excerpt scrape when body has no image", () => {
    expect(
      resolvePostPreviewImage({
        images: [],
        body: "plain text",
        excerpt: "![alt](https://cdn.example/from-excerpt.jpg)",
      }),
    ).toBe("https://cdn.example/from-excerpt.jpg");
  });

  it("returns null when no gallery or scraped image", () => {
    expect(resolvePostPreviewImage({ images: [], body: "plain", excerpt: "plain" })).toBeNull();
  });
});
