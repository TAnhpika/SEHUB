import { describe, expect, it } from "vitest";
import {
  MODERATOR_HOME_PATH,
  flattenModeratorNavItems,
  isModeratorNavActive,
  resolveModeratorPageTitle,
} from "@/features/moderator/moderatorNavData";

describe("moderatorNavData", () => {
  describe("MODERATOR_HOME_PATH", () => {
    it("points to reports queue as default moderator landing", () => {
      expect(MODERATOR_HOME_PATH).toBe("/moderator/reports");
    });
  });

  describe("flattenModeratorNavItems", () => {
    it("returns flat list of all nav items", () => {
      const items = flattenModeratorNavItems();
      expect(items.length).toBeGreaterThan(5);
      expect(items.some((item) => item.id === "reports")).toBe(true);
      expect(items.some((item) => item.id === "violations")).toBe(true);
    });
  });

  describe("resolveModeratorPageTitle", () => {
    it("resolves titles for known moderator routes", () => {
      expect(resolveModeratorPageTitle("/moderator/reports")).toBe("Xử lý báo cáo");
      expect(resolveModeratorPageTitle("/moderator/violations")).toBe("Tài khoản vi phạm");
    });

    it("resolves wizard page titles by path pattern", () => {
      expect(resolveModeratorPageTitle("/moderator/final-exams/add/questions")).toBe(
        "Thêm đề cuối kỳ",
      );
      expect(resolveModeratorPageTitle("/moderator/final-exams/edit/123")).toBe("Sửa đề cuối kỳ");
    });

    it("falls back for unknown moderator paths", () => {
      expect(resolveModeratorPageTitle("/moderator/unknown-section")).toBe("Kiểm duyệt");
      expect(resolveModeratorPageTitle("/moderator")).toBe("Xử lý báo cáo");
    });
  });

  describe("isModeratorNavActive", () => {
    it("matches exact path when item.end is true", () => {
      const item = { to: "/moderator/reports", end: true };
      expect(isModeratorNavActive(item, "/moderator/reports")).toBe(true);
      expect(isModeratorNavActive(item, "/moderator/reports/123")).toBe(false);
    });

    it("matches prefix paths when item.end is false", () => {
      const item = { to: "/moderator/violations", end: false };
      expect(isModeratorNavActive(item, "/moderator/violations")).toBe(true);
      expect(isModeratorNavActive(item, "/moderator/violations/user-1")).toBe(true);
      expect(isModeratorNavActive(item, "/moderator/reports")).toBe(false);
    });
  });
});
