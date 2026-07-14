import { describe, expect, it } from "vitest";
import { mapWizardQuestionsToCreateItems } from "@/api/adminMapper";

describe("mapWizardQuestionsToCreateItems images", () => {
  it("sends imageUrls separately and keeps content without img markup", () => {
    const items = mapWizardQuestionsToCreateItems([
      {
        content: "<p>Câu hỏi</p>",
        questionType: "SingleChoice",
        optionLabels: ["A", "B"],
        answers: { A: "1", B: "2" },
        correctAnswer: "A",
        images: [
          {
            key: "1",
            file: null,
            previewUrl: "https://cdn.example/q.png",
            url: "https://cdn.example/q.png",
            existingId: "img-1",
          },
          {
            key: "2",
            file: new File(["x"], "new.jpg", { type: "image/jpeg" }),
            previewUrl: "blob:local",
            existingId: null,
          },
        ],
      },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0].content).toContain("Câu hỏi");
    expect(items[0].content).not.toContain("<img");
    expect(items[0].imageUrls).toEqual(["https://cdn.example/q.png"]);
  });
});
