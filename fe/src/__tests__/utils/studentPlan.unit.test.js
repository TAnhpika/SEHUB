import { describe, expect, it } from "vitest";
import {
  STUDENT_PLAN,
  getPlanLabel,
  isStaffRole,
  resolveIsPremium,
} from "@/utils/studentPlan";
import {
  mockAdmin,
  mockFreeStudent,
  mockGuestUser,
  mockMalformedUser,
  mockModerator,
  mockPremiumStudent,
  mockUnknownRoleUser,
} from "../fixtures/mockUsers";

describe("studentPlan", () => {
  describe("STUDENT_PLAN constants", () => {
    it("maps FREE to Basic and PREMIUM to Premium", () => {
      expect(STUDENT_PLAN.FREE).toBe("Basic");
      expect(STUDENT_PLAN.PREMIUM).toBe("Premium");
    });
  });

  describe("isStaffRole", () => {
    it("returns true only for admin and moderator", () => {
      expect(isStaffRole("admin")).toBe(true);
      expect(isStaffRole("moderator")).toBe(true);
    });

    it("returns false for student, guest, and unknown roles", () => {
      expect(isStaffRole("student")).toBe(false);
      expect(isStaffRole(null)).toBe(false);
      expect(isStaffRole(undefined)).toBe(false);
      expect(isStaffRole("partner")).toBe(false);
    });
  });

  describe("resolveIsPremium", () => {
    describe("happy paths", () => {
      it("grants premium to admin and moderator regardless of plan", () => {
        expect(resolveIsPremium(mockAdmin)).toBe(true);
        expect(resolveIsPremium(mockModerator)).toBe(true);
      });

      it("grants premium to student with Premium plan", () => {
        expect(resolveIsPremium(mockPremiumStudent)).toBe(true);
      });

      it("denies premium to free student", () => {
        expect(resolveIsPremium(mockFreeStudent)).toBe(false);
      });
    });

    describe("edge cases and error states", () => {
      it("returns false for null or undefined user", () => {
        expect(resolveIsPremium(mockGuestUser)).toBe(false);
        expect(resolveIsPremium(undefined)).toBe(false);
      });

      it("returns false for non-student non-staff roles even with Premium plan", () => {
        expect(resolveIsPremium(mockUnknownRoleUser)).toBe(false);
      });

      it("returns false when plan is misspelled or unknown", () => {
        expect(resolveIsPremium(mockMalformedUser)).toBe(false);
        expect(resolveIsPremium({ role: "student", plan: "premium" })).toBe(false);
      });

      it("treats student without plan as non-premium", () => {
        expect(resolveIsPremium({ role: "student" })).toBe(false);
      });
    });
  });

  describe("getPlanLabel", () => {
    it("returns Premium for PREMIUM plan constant", () => {
      expect(getPlanLabel(STUDENT_PLAN.PREMIUM)).toBe("Premium");
    });

    it("returns Basic for FREE plan and any other value", () => {
      expect(getPlanLabel(STUDENT_PLAN.FREE)).toBe("Basic");
      expect(getPlanLabel(null)).toBe("Basic");
      expect(getPlanLabel(undefined)).toBe("Basic");
      expect(getPlanLabel("UnknownPlan")).toBe("Basic");
    });
  });
});
