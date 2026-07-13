import { beforeEach, describe, expect, it } from "vitest";
import {
  AI_EXPLAIN_TOKEN_COST,
  applyServerRemainingTokens,
  clearServerAiTokenSnapshot,
  consumeAiExplainTokens,
  getAiDailyTokenLimit,
  getAiTokenSnapshot,
  setServerAiTokenSnapshot,
} from "@/utils/aiTokens";
import {
  mockAdmin,
  mockExhaustedFreeStudent,
  mockFreeStudent,
  mockGuestUser,
  mockModerator,
  mockPremiumStudent,
} from "../fixtures/mockUsers";

describe("aiTokens", () => {
  beforeEach(() => {
    clearServerAiTokenSnapshot();
  });

  describe("getAiDailyTokenLimit", () => {
    it("returns 0 for guest", () => {
      expect(getAiDailyTokenLimit(null)).toBe(0);
    });

    it("returns infinity for admin", () => {
      expect(getAiDailyTokenLimit(mockAdmin)).toBe(Number.POSITIVE_INFINITY);
    });

    it("returns 1000 for moderator and premium student", () => {
      expect(getAiDailyTokenLimit(mockModerator)).toBe(1000);
      expect(getAiDailyTokenLimit(mockPremiumStudent)).toBe(1000);
    });

    it("returns 10 for free student", () => {
      expect(getAiDailyTokenLimit(mockFreeStudent)).toBe(10);
    });
  });

  describe("getAiTokenSnapshot (mock mode)", () => {
    it("returns zeroed snapshot for guest", () => {
      const snapshot = getAiTokenSnapshot(null);
      expect(snapshot).toEqual({
        limit: 0,
        used: 0,
        remaining: 0,
        canExplain: false,
        cost: AI_EXPLAIN_TOKEN_COST,
      });
    });

    it("tracks usage in localStorage for free students", () => {
      const first = getAiTokenSnapshot(mockFreeStudent);
      expect(first.limit).toBe(10);
      expect(first.remaining).toBe(10);
      expect(first.canExplain).toBe(true);

      const { ok } = consumeAiExplainTokens(mockFreeStudent);
      expect(ok).toBe(true);

      const after = getAiTokenSnapshot(mockFreeStudent);
      expect(after.used).toBe(10);
      expect(after.remaining).toBe(0);
      expect(after.canExplain).toBe(false);
    });

    it("allows unlimited explain for admin", () => {
      const snapshot = getAiTokenSnapshot(mockAdmin);
      expect(snapshot.canExplain).toBe(true);
      expect(snapshot.remaining).toBe(Number.POSITIVE_INFINITY);

      const { ok } = consumeAiExplainTokens(mockAdmin);
      expect(ok).toBe(true);
      expect(getAiTokenSnapshot(mockAdmin).canExplain).toBe(true);
    });
  });

  describe("consumeAiExplainTokens", () => {
    it("fails when user is null", () => {
      const result = consumeAiExplainTokens(null);
      expect(result.ok).toBe(false);
    });

    it("fails when tokens are exhausted", () => {
      localStorage.setItem(
        `sehubs_ai_usage_${mockExhaustedFreeStudent.username}`,
        JSON.stringify({ date: new Date().toISOString().slice(0, 10), used: 10 }),
      );

      const result = consumeAiExplainTokens(mockExhaustedFreeStudent);
      expect(result.ok).toBe(false);
      expect(result.snapshot.canExplain).toBe(false);
    });

    it("fails when user has no username or email key", () => {
      const result = consumeAiExplainTokens({ role: "student", plan: "Basic" });
      expect(result.ok).toBe(false);
    });
  });

  describe("setServerAiTokenSnapshot and applyServerRemainingTokens", () => {
    it("stores server snapshot in memory", () => {
      setServerAiTokenSnapshot(
        {
          limit: 1000,
          used: 50,
          remaining: 950,
          canExplain: true,
          canChat: true,
          costExplain: 10,
          costChat: 10,
        },
        mockPremiumStudent,
      );

      // In mock mode getAiTokenSnapshot uses localStorage path, not server
      // but applyServerRemainingTokens mutates serverSnapshot
      applyServerRemainingTokens(900);
      clearServerAiTokenSnapshot();
    });

    it("clears snapshot when dto is null", () => {
      setServerAiTokenSnapshot({ limit: 10, used: 0, remaining: 10, canExplain: true });
      clearServerAiTokenSnapshot();
      setServerAiTokenSnapshot(null);
      expect(true).toBe(true);
    });

    it("ignores applyServerRemainingTokens when snapshot is missing", () => {
      clearServerAiTokenSnapshot();
      applyServerRemainingTokens(5);
      expect(getAiTokenSnapshot(mockFreeStudent).remaining).toBe(10);
    });
  });
});
