import { describe, expect, it } from "vitest";
import { mapModerationPostImages } from "@/utils/mapModerationPostImages";

describe("mapModerationPostImages", () => {
  it("returns empty array for empty input", () => {
    expect(mapModerationPostImages()).toEqual([]);
    expect(mapModerationPostImages([])).toEqual([]);
  });

  it("sorts by sortOrder and uses imagePath", () => {
    const result = mapModerationPostImages([
      { id: "b", sortOrder: 1, imagePath: "https://cdn.example/b.jpg" },
      { id: "a", sortOrder: 0, imagePath: "https://cdn.example/a.jpg" },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: "a",
      url: "https://cdn.example/a.jpg",
      alt: "Ảnh 1",
      caption: "Ảnh 1",
    });
    expect(result[1]).toMatchObject({
      id: "b",
      url: "https://cdn.example/b.jpg",
      alt: "Ảnh 2",
    });
    expect(result[0]).not.toHaveProperty("coverImage");
  });

  it("skips entries without url", () => {
    expect(
      mapModerationPostImages([{ id: "x", sortOrder: 0, imagePath: "" }, { url: "https://cdn.example/ok.jpg" }]),
    ).toEqual([
      expect.objectContaining({
        url: "https://cdn.example/ok.jpg",
        alt: "Ảnh 1",
      }),
    ]);
  });
});
