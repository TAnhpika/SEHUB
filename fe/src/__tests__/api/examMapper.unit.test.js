import { describe, expect, it } from "vitest";
import {
  buildSaveAnswersPayload,
  mapAiExplainResponse,
  mapAttemptAnswersToUi,
  mapExamAiChatResponse,
  mapExamAttachmentDto,
  mapExamDetailDtoToFeExam,
  mapExamResultToLocalResult,
  mapQuestionAnswerDto,
  mapQuestionOptionDto,
  mapQuestionPublicDto,
} from "@/api/examMapper";
import {
  mockExamDetailDto,
  mockMultiSelectQuestionDto,
  mockPracticeExamDetailDto,
  mockQuestionAnswerDto,
  mockQuestionPublicDto,
} from "../fixtures/mockApiDtos";

describe("examMapper", () => {
  describe("mapExamAttachmentDto", () => {
    it("builds view path when missing and resolves full URL", () => {
      const attachment = mapExamAttachmentDto(
        { id: "att-1", originalFileName: "exam.pdf", contentType: "application/pdf" },
        "exam-uuid",
      );
      expect(attachment.viewPath).toContain("/api/v1/exams/exam-uuid/attachments/att-1/view");
      expect(attachment.viewUrl).toContain("localhost:5006");
    });
  });

  describe("mapExamDetailDtoToFeExam", () => {
    it("maps final exam DTO with attachments and term metadata", () => {
      const exam = mapExamDetailDtoToFeExam(mockExamDetailDto, "prf192");
      expect(exam.apiId).toBe(mockExamDetailDto.id);
      expect(exam.courseCode).toBe("PRF192");
      expect(exam.type).toBe("Cuối kỳ");
      expect(exam.examType).toBe("Final");
      expect(exam.attachments).toHaveLength(1);
      expect(exam.term).toBe("SU");
      expect(exam.year).toBe("2026");
    });

    it("maps practice exam type label", () => {
      const exam = mapExamDetailDtoToFeExam(mockPracticeExamDetailDto, "SWE201c");
      expect(exam.type).toBe("Thực hành");
      expect(exam.subjectCode).toBe("SWE201c");
    });
  });

  describe("mapQuestionPublicDto and mapQuestionOptionDto", () => {
    it("maps public question without revealing answers", () => {
      const question = mapQuestionPublicDto(mockQuestionPublicDto);
      expect(question.text).toBe(mockQuestionPublicDto.content);
      expect(question.correctAnswer).toBe(null);
      expect(question.options).toHaveLength(2);
      expect(question.options[0].key).toBe("A");
    });

    it("falls back to single-char label when text is object stringified", () => {
      const option = mapQuestionOptionDto({ label: "C", text: "[object Object]" });
      expect(option.label).toBe("[object Object]");
      expect(option.key).toBe("C");
    });

    it("uses multi-char label when text is invalid", () => {
      const option = mapQuestionOptionDto({ label: "Choice C", text: "[object Object]" });
      expect(option.label).toBe("Choice C");
    });
  });

  describe("mapQuestionAnswerDto", () => {
    it("maps single-choice correct answer", () => {
      const question = mapQuestionAnswerDto(mockQuestionAnswerDto);
      expect(question.correctAnswer).toBe("A");
      expect(question.correctAnswers).toEqual([]);
    });

    it("maps multi-select correct answers array", () => {
      const question = mapQuestionAnswerDto(mockMultiSelectQuestionDto);
      expect(question.correctAnswers).toEqual(["A", "C"]);
      expect(question.correctAnswer).toBe("A");
    });
  });

  describe("mapAttemptAnswersToUi and buildSaveAnswersPayload", () => {
    const questions = [
      mapQuestionAnswerDto(mockQuestionAnswerDto),
      mapQuestionAnswerDto(mockMultiSelectQuestionDto),
    ];

    it("converts API option IDs to UI answer keys", () => {
      const uiAnswers = mapAttemptAnswersToUi(questions, {
        "q-001": "opt-a",
        "q-002": ["opt-a", "opt-c"],
      });
      expect(uiAnswers["q-001"]).toBe("A");
      expect(uiAnswers["q-002"]).toEqual(["A", "C"]);
    });

    it("builds save payload from UI answers", () => {
      const payload = buildSaveAnswersPayload(questions, {
        "q-001": "A",
        "q-002": ["A", "C"],
      });
      expect(payload.answers["q-001"]).toEqual(["opt-a"]);
      expect(payload.answers["q-002"]).toEqual(["opt-a", "opt-c"]);
    });

    it("skips unanswered questions in both directions", () => {
      expect(mapAttemptAnswersToUi(questions, {})).toEqual({});
      expect(buildSaveAnswersPayload(questions, {})).toEqual({ answers: {} });
    });
  });

  describe("mapExamResultToLocalResult", () => {
    it("maps API result to local summary with per-question breakdown", () => {
      const questions = [mapQuestionAnswerDto(mockQuestionAnswerDto)];
      const result = mapExamResultToLocalResult(
        {
          totalQuestions: 1,
          correctCount: 1,
          score: 100,
          answers: [
            {
              questionId: "q-001",
              selectedOptionIds: ["opt-a"],
              correctOptionIds: ["opt-a"],
              isCorrect: true,
            },
          ],
        },
        questions,
      );
      expect(result.correctCount).toBe(1);
      expect(result.scorePercent).toBe(100);
      expect(result.items[0].isCorrect).toBe(true);
      expect(result.items[0].selectedAnswer).toBe("A");
    });
  });

  describe("mapAiExplainResponse", () => {
    it("splits explanation into intro and bullet paragraphs", () => {
      const mapped = mapAiExplainResponse({
        explanation: "Đáp án là A.\n\nVì OOP hỗ trợ tái sử dụng code.",
        tokensUsed: 10,
        remainingTokens: 990,
      });
      expect(mapped?.intro).toBe("Đáp án là A.");
      expect(mapped?.bullets).toHaveLength(1);
      expect(mapped?.tokensUsed).toBe(10);
    });

    it("returns null for empty explanation", () => {
      expect(mapAiExplainResponse({ explanation: "  " })).toBe(null);
      expect(mapAiExplainResponse(null)).toBe(null);
    });
  });

  describe("mapExamAiChatResponse", () => {
    it("normalizes chat thread and message roles", () => {
      const mapped = mapExamAiChatResponse({
        threadId: "thread-1",
        reply: "Giải thích thêm về đa hình",
        tokensUsed: 5,
        remainingTokens: 995,
        messages: [
          { id: "m1", role: "user", text: "Tại sao?", createdAt: "2026-07-10T10:00:00Z" },
          { id: "m2", role: "assistant", text: "Vì...", createdAt: "2026-07-10T10:00:05Z" },
        ],
      });
      expect(mapped.threadId).toBe("thread-1");
      expect(mapped.messages).toHaveLength(2);
      expect(mapped.messages[1].role).toBe("assistant");
    });
  });
});
