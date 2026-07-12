import { describe, expect, it } from "vitest";
import {
  OPTION_LABELS,
  QUESTION_TYPES,
  createEmptyAnswers,
  getQuestionOptionLabels,
  getSelectedAnswerKeys,
  isMultiSelectQuestion,
  isQuestionAnswered,
  labelsToOptionIds,
  optionIdsToLabels,
  setSingleSelectAnswer,
  toggleMultiSelectAnswer,
} from "@/features/exams/examQuestionTypes";

describe("examQuestionTypes", () => {
  describe("isMultiSelectQuestion", () => {
    it("detects MultiSelect question type case-insensitively", () => {
      expect(isMultiSelectQuestion({ questionType: "MultiSelect" })).toBe(true);
      expect(isMultiSelectQuestion({ questionType: "multiselect" })).toBe(true);
      expect(isMultiSelectQuestion({ questionType: "SingleChoice" })).toBe(false);
    });
  });

  describe("createEmptyAnswers and getQuestionOptionLabels", () => {
    it("creates empty answer map for default labels", () => {
      const answers = createEmptyAnswers();
      expect(Object.keys(answers)).toEqual(["A", "B", "C", "D"]);
      expect(Object.values(answers).every((v) => v === "")).toBe(true);
    });

    it("reads option labels from question answers object", () => {
      const labels = getQuestionOptionLabels({
        answers: { C: "", A: "", B: "" },
      });
      expect(labels).toEqual(["A", "B", "C"]);
    });
  });

  describe("getSelectedAnswerKeys", () => {
    it("normalizes single and multi-select stored answers", () => {
      expect(getSelectedAnswerKeys("q1", { q1: "B" })).toEqual(["B"]);
      expect(getSelectedAnswerKeys("q2", { q2: ["A", "C"] })).toEqual(["A", "C"]);
      expect(getSelectedAnswerKeys("q3", { q3: "" })).toEqual([]);
    });
  });

  describe("isQuestionAnswered", () => {
    it("requires one selection for single-choice", () => {
      const question = { questionType: QUESTION_TYPES.SINGLE };
      expect(isQuestionAnswered("q1", { q1: "A" }, question)).toBe(true);
      expect(isQuestionAnswered("q1", {}, question)).toBe(false);
    });

    it("requires required count for multi-select", () => {
      const question = {
        questionType: QUESTION_TYPES.MULTI,
        requiredSelectCount: 2,
      };
      expect(isQuestionAnswered("q1", { q1: ["A"] }, question)).toBe(false);
      expect(isQuestionAnswered("q1", { q1: ["A", "B"] }, question)).toBe(true);
    });
  });

  describe("toggleMultiSelectAnswer", () => {
    it("adds and removes options up to required count", () => {
      const first = toggleMultiSelectAnswer("q1", "A", {}, 2);
      expect(getSelectedAnswerKeys("q1", first)).toEqual(["A"]);

      const second = toggleMultiSelectAnswer("q1", "B", first, 2);
      expect(getSelectedAnswerKeys("q1", second)).toEqual(["A", "B"]);

      const removed = toggleMultiSelectAnswer("q1", "A", second, 2);
      expect(getSelectedAnswerKeys("q1", removed)).toEqual(["B"]);
    });

    it("does not exceed required selection count", () => {
      const answers = { q1: ["A", "B"] };
      const unchanged = toggleMultiSelectAnswer("q1", "C", answers, 2);
      expect(unchanged).toBe(answers);
    });
  });

  describe("setSingleSelectAnswer", () => {
    it("sets one answer key per question", () => {
      expect(setSingleSelectAnswer("q1", "C", {})).toEqual({ q1: "C" });
    });
  });

  describe("optionIdsToLabels and labelsToOptionIds", () => {
    const options = [
      { key: "A", label: "A", optionId: "opt-a" },
      { key: "B", label: "B", optionId: "opt-b" },
      { key: "C", label: "C", optionId: "opt-c" },
    ];

    it("converts between option ids and label keys", () => {
      expect(optionIdsToLabels(options, ["opt-b", "opt-c"])).toEqual(["B", "C"]);
      expect(labelsToOptionIds(options, ["A", "C"])).toEqual(["opt-a", "opt-c"]);
    });
  });

  describe("OPTION_LABELS", () => {
    it("exports A through H option labels", () => {
      expect(OPTION_LABELS).toEqual(["A", "B", "C", "D", "E", "F", "G", "H"]);
    });
  });
});
