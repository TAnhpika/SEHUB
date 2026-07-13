import { describe, expect, it } from "vitest";
import { resolveAssetUrl } from "@/api/assetUrl";

describe("assetUrl", () => {
  describe("resolveAssetUrl", () => {
    it("returns absolute HTTP(S) URLs unchanged", () => {
      expect(resolveAssetUrl("https://cdn.example.com/a.png")).toBe(
        "https://cdn.example.com/a.png",
      );
    });

    it("prefixes root-relative paths with API base", () => {
      expect(resolveAssetUrl("/uploads/avatar.png")).toBe(
        "http://localhost:5006/uploads/avatar.png",
      );
    });

    it("adds slash for bare relative paths", () => {
      expect(resolveAssetUrl("uploads/doc.pdf")).toBe(
        "http://localhost:5006/uploads/doc.pdf",
      );
    });

    it("returns null for empty or whitespace-only paths", () => {
      expect(resolveAssetUrl(null)).toBe(null);
      expect(resolveAssetUrl("")).toBe(null);
      expect(resolveAssetUrl("   ")).toBe(null);
    });
  });
});
