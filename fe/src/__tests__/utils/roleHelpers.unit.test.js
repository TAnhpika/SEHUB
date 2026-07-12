import { describe, expect, it } from "vitest";
import { MODERATOR_HOME_PATH } from "@/features/moderator/moderatorNavData";
import {
  getRoleHomePath,
  isStaffUser,
  resolveAuthenticatedLandingPath,
} from "@/utils/roleHelpers";
import {
  mockAdmin,
  mockFreeStudent,
  mockGuestUser,
  mockMalformedUser,
  mockModerator,
  mockPremiumStudent,
  mockUnknownRoleUser,
} from "../fixtures/mockUsers";

describe("roleHelpers", () => {
  describe("isStaffUser", () => {
    describe("happy paths", () => {
      it("returns true for admin role", () => {
        expect(isStaffUser(mockAdmin)).toBe(true);
      });

      it("returns true for moderator role", () => {
        expect(isStaffUser(mockModerator)).toBe(true);
      });

      it("returns false for student role", () => {
        expect(isStaffUser(mockFreeStudent)).toBe(false);
        expect(isStaffUser(mockPremiumStudent)).toBe(false);
      });
    });

    describe("edge cases and error states", () => {
      it("returns false when user is null or undefined", () => {
        expect(isStaffUser(null)).toBe(false);
        expect(isStaffUser(undefined)).toBe(false);
      });

      it("returns false when role is missing or empty", () => {
        expect(isStaffUser({})).toBe(false);
        expect(isStaffUser({ role: "" })).toBe(false);
        expect(isStaffUser(mockMalformedUser)).toBe(false);
      });

      it("returns false for unknown roles such as partner", () => {
        expect(isStaffUser(mockUnknownRoleUser)).toBe(false);
      });

      it("is case-sensitive and does not treat Admin as staff", () => {
        expect(isStaffUser({ role: "Admin" })).toBe(false);
        expect(isStaffUser({ role: "MODERATOR" })).toBe(false);
      });
    });
  });

  describe("getRoleHomePath", () => {
    describe("happy paths", () => {
      it("routes admin to /admin", () => {
        expect(getRoleHomePath(mockAdmin)).toBe("/admin");
      });

      it("routes moderator to MODERATOR_HOME_PATH", () => {
        expect(getRoleHomePath(mockModerator)).toBe(MODERATOR_HOME_PATH);
        expect(getRoleHomePath(mockModerator)).toBe("/moderator/reports");
      });

      it("routes student to default fallback /home", () => {
        expect(getRoleHomePath(mockFreeStudent)).toBe("/home");
        expect(getRoleHomePath(mockPremiumStudent)).toBe("/home");
      });

      it("respects custom fallback for non-staff roles", () => {
        expect(getRoleHomePath(mockFreeStudent, "/community")).toBe("/community");
      });
    });

    describe("edge cases and error states", () => {
      it("returns fallback for guest (null user)", () => {
        expect(getRoleHomePath(mockGuestUser)).toBe("/home");
        expect(getRoleHomePath(null, "/login")).toBe("/login");
      });

      it("returns fallback for malformed or unknown roles", () => {
        expect(getRoleHomePath(mockMalformedUser)).toBe("/home");
        expect(getRoleHomePath(mockUnknownRoleUser)).toBe("/home");
      });
    });
  });

  describe("resolveAuthenticatedLandingPath", () => {
    describe("happy paths", () => {
      it("redirects staff away from /home to their workspace", () => {
        expect(resolveAuthenticatedLandingPath(mockAdmin, "/home")).toBe("/admin");
        expect(resolveAuthenticatedLandingPath(mockModerator, "/home")).toBe(
          MODERATOR_HOME_PATH,
        );
      });

      it("keeps student on requested landing path", () => {
        expect(resolveAuthenticatedLandingPath(mockPremiumStudent, "/home")).toBe("/home");
        expect(resolveAuthenticatedLandingPath(mockFreeStudent, "/community")).toBe(
          "/community",
        );
      });
    });

    describe("edge cases and error states", () => {
      it("uses default /home when path argument is omitted for students", () => {
        expect(resolveAuthenticatedLandingPath(mockFreeStudent)).toBe("/home");
      });

      it("returns staff workspace even when path is /community", () => {
        expect(resolveAuthenticatedLandingPath(mockModerator, "/community")).toBe(
          MODERATOR_HOME_PATH,
        );
      });

      it("returns fallback for unauthenticated user", () => {
        expect(resolveAuthenticatedLandingPath(null, "/home")).toBe("/home");
      });
    });
  });
});
