import { describe, expect, it } from "vitest";
import { mapModerationPostImages } from "@/utils/mapModerationPostImages";

describe("mapModerationPostImages", () => {
  describe("happy paths", () => {
    it("sorts images by sortOrder and maps cover plus inline images", () => {
      const result = mapModerationPostImages([
        { id: "img-2", sortOrder: 2, imagePath: "/uploads/inline.jpg" },
        { id: "img-1", sortOrder: 0, imagePath: "/uploads/cover.jpg" },
        { id: "img-3", sortOrder: 1, imagePath: "/uploads/mid.jpg" },
      ]);

      expect(result.coverImage?.url).toContain("/uploads/cover.jpg");
      expect(result.coverImage?.alt).toBe("Ảnh bìa");
      expect(result.inlineImages).toHaveLength(2);
      expect(result.inlineImages[0].caption).toBe("Ảnh 1");
      expect(result.inlineImages[1].caption).toBe("Ảnh 2");
    });

    it("accepts absolute URLs via url field", () => {
      const result = mapModerationPostImages([
        { url: "https://cdn.sehub.vn/photo.png", sortOrder: 0 },
      ]);
      expect(result.coverImage?.url).toBe("https://cdn.sehub.vn/photo.png");
      expect(result.inlineImages).toEqual([]);
    });
  });

  describe("edge cases and error states", () => {
    it("returns empty structure when images array is empty", () => {
      expect(mapModerationPostImages([])).toEqual({
        coverImage: null,
        inlineImages: [],
      });
    });

    it("skips images without resolvable URL", () => {
      const result = mapModerationPostImages([
        { id: "bad", sortOrder: 0, imagePath: "" },
        { id: "good", sortOrder: 1, imagePath: "/uploads/ok.jpg" },
      ]);
      expect(result.coverImage?.url).toContain("/uploads/ok.jpg");
      expect(result.inlineImages).toEqual([]);
    });

    it("generates fallback ids when image id is missing", () => {
      const result = mapModerationPostImages([{ imagePath: "/uploads/a.jpg" }]);
      expect(result.coverImage).not.toBe(null);
    });
  });
});
