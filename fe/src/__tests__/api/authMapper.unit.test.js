import { describe, expect, it } from "vitest";
import { deriveUsernameFromEmail, mapApiUser } from "@/api/authMapper";
import { mockApiUserDto, mockFreeApiUserDto } from "../fixtures/mockApiDtos";

describe("authMapper", () => {
  describe("mapApiUser", () => {
    it("maps premium student DTO to FE auth user shape", () => {
      const user = mapApiUser(mockApiUserDto);
      expect(user).toMatchObject({
        id: mockApiUserDto.id,
        username: "demo_student",
        email: mockApiUserDto.email,
        displayName: "Demo Premium",
        initial: "D",
        role: "student",
        isPremium: true,
        plan: "Premium",
        points: 1250,
        level: "Gold",
        emailConfirmed: true,
      });
      expect(user.avatarUrl).toBe("/uploads/avatars/demo.png");
    });

    it("falls back displayName to username then email", () => {
      const user = mapApiUser(mockFreeApiUserDto);
      expect(user.displayName).toBe("free_student");
      expect(user.plan).toBe("Basic");
      expect(user.isPremium).toBe(false);
    });

    it("assigns role labels for staff roles", () => {
      expect(mapApiUser({ ...mockApiUserDto, role: "Admin" }).roleLabel).toBe(
        "Quản trị viên",
      );
      expect(mapApiUser({ ...mockApiUserDto, role: "Moderator" }).roleLabel).toBe(
        "Kiểm duyệt viên",
      );
    });

    it("returns null for null or undefined dto", () => {
      expect(mapApiUser(null)).toBe(null);
      expect(mapApiUser(undefined)).toBe(null);
    });
  });

  describe("deriveUsernameFromEmail", () => {
    it("sanitizes local part of email into valid username", () => {
      expect(deriveUsernameFromEmail("demo.student@sehub.local")).toBe("demo_student");
      expect(deriveUsernameFromEmail("nguyen.van.a@fpt.edu.vn")).toBe("nguyen_van_a");
    });

    it("prefixes user_ when sanitized local part is too short", () => {
      expect(deriveUsernameFromEmail("a@x.com")).toBe("user_a");
      expect(deriveUsernameFromEmail("@empty.com")).toBe("user_sehub");
    });

    it("truncates username to max 50 characters", () => {
      const longLocal = "a".repeat(60);
      expect(deriveUsernameFromEmail(`${longLocal}@test.com`).length).toBeLessThanOrEqual(50);
    });
  });
});
