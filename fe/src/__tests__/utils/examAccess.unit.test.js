import { beforeEach, describe, expect, it } from "vitest";
import {
  canCommentOnExamQuestion,
  canSubmitPracticeExam,
  canTakeReviewExam,
  canUseExamAiChat,
  canUseReviewStudyTools,
  canViewExamAnswers,
  getExamAiAccess,
} from "@/utils/examAccess";
import { clearServerAiTokenSnapshot } from "@/utils/aiTokens";
import {
  mockAdmin,
  mockExhaustedFreeStudent,
  mockFreeStudent,
  mockGuestUser,
  mockModerator,
  mockPremiumStudent,
  mockUnknownRoleUser,
} from "../fixtures/mockUsers";

describe("examAccess", () => {
  beforeEach(() => {
    clearServerAiTokenSnapshot();
  });

  describe("canViewExamAnswers", () => {
    it("allows admin, moderator, and premium students", () => {
      expect(canViewExamAnswers(mockAdmin)).toBe(true);
      expect(canViewExamAnswers(mockModerator)).toBe(true);
      expect(canViewExamAnswers(mockPremiumStudent)).toBe(true);
    });

    it("denies guest and free students", () => {
      expect(canViewExamAnswers(mockGuestUser)).toBe(false);
      expect(canViewExamAnswers(mockFreeStudent)).toBe(false);
    });

    it("denies unknown non-staff roles", () => {
      expect(canViewExamAnswers(mockUnknownRoleUser)).toBe(false);
    });
  });

  describe("canTakeReviewExam", () => {
    it("mirrors canViewExamAnswers permissions", () => {
      expect(canTakeReviewExam(mockPremiumStudent)).toBe(true);
      expect(canTakeReviewExam(mockFreeStudent)).toBe(false);
      expect(canTakeReviewExam(null)).toBe(false);
    });
  });

  describe("canSubmitPracticeExam", () => {
    it("allows premium and staff to submit practice exams", () => {
      expect(canSubmitPracticeExam(mockPremiumStudent)).toBe(true);
      expect(canSubmitPracticeExam(mockModerator)).toBe(true);
    });

    it("blocks guest and free students", () => {
      expect(canSubmitPracticeExam(mockGuestUser)).toBe(false);
      expect(canSubmitPracticeExam(mockFreeStudent)).toBe(false);
    });
  });

  describe("canCommentOnExamQuestion and canUseReviewStudyTools", () => {
    it("require premium or staff for commenting and study tools", () => {
      expect(canCommentOnExamQuestion(mockAdmin)).toBe(true);
      expect(canCommentOnExamQuestion(mockFreeStudent)).toBe(false);
      expect(canUseReviewStudyTools(mockPremiumStudent)).toBe(true);
      expect(canUseReviewStudyTools(mockFreeStudent)).toBe(false);
    });
  });

  describe("canUseExamAiChat", () => {
    it("allows staff and premium for follow-up AI chat", () => {
      expect(canUseExamAiChat(mockAdmin)).toBe(true);
      expect(canUseExamAiChat(mockPremiumStudent)).toBe(true);
    });

    it("denies guest and free students", () => {
      expect(canUseExamAiChat(null)).toBe(false);
      expect(canUseExamAiChat(mockFreeStudent)).toBe(false);
    });
  });

  describe("getExamAiAccess", () => {
    it("returns guest status with zero tokens for unauthenticated users", () => {
      const access = getExamAiAccess(null);
      expect(access.status).toBe("guest");
      expect(access.snapshot.limit).toBe(0);
      expect(access.snapshot.canExplain).toBe(false);
    });

    it("returns ready status when free student has remaining tokens", () => {
      const access = getExamAiAccess(mockFreeStudent);
      expect(access.status).toBe("ready");
      expect(access.snapshot.limit).toBe(10);
      expect(access.snapshot.canExplain).toBe(true);
    });

    it("returns exhausted status when free student used all daily tokens", () => {
      localStorage.setItem(
        `sehubs_ai_usage_${mockExhaustedFreeStudent.username}`,
        JSON.stringify({ date: new Date().toISOString().slice(0, 10), used: 10 }),
      );

      const access = getExamAiAccess(mockExhaustedFreeStudent);
      expect(access.status).toBe("exhausted");
      expect(access.snapshot.remaining).toBe(0);
      expect(access.snapshot.canExplain).toBe(false);
    });

    it("returns ready for admin with unlimited tokens", () => {
      const access = getExamAiAccess(mockAdmin);
      expect(access.status).toBe("ready");
      expect(access.snapshot.canExplain).toBe(true);
      expect(access.snapshot.remaining).toBe(Number.POSITIVE_INFINITY);
    });
  });
});
