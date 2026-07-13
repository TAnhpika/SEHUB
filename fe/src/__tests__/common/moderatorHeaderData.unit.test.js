import { describe, expect, it, vi } from "vitest";
import {
  MODERATOR_QUICK_LINKS,
  buildModeratorNotifications,
  getModeratorUnreadCount,
} from "@/common/Header/ModeratorHeader/moderatorHeaderData";

vi.mock("@/features/moderator/moderatorNavData", () => ({
  getModeratorNavBadgeCounts: () => ({
    reports: 2,
    content: 1,
    violations: 0,
    "practice-submissions": 0,
  }),
}));

vi.mock("@/features/exams/practiceExamSubmissions", () => ({
  getPendingPracticeSubmissionCount: () => 3,
}));

describe("moderatorHeaderData", () => {
  describe("MODERATOR_QUICK_LINKS", () => {
    it("defines moderator workflow shortcuts with routes", () => {
      const ids = MODERATOR_QUICK_LINKS.map((item) => item.id);
      expect(ids).toContain("reports");
      expect(ids).toContain("content");
      expect(ids).toContain("practice-submissions");

      const reports = MODERATOR_QUICK_LINKS.find((item) => item.id === "reports");
      expect(reports?.to).toBe("/moderator/reports");
      expect(reports?.label).toBeTruthy();
    });
  });

  describe("buildModeratorNotifications", () => {
    it("builds fallback notifications from badge counts and practice queue", () => {
      const items = buildModeratorNotifications();

      expect(items).toHaveLength(3);
      expect(items[0].title).toContain("báo cáo");
      expect(items[1].title).toContain("bài viết");
      expect(items[2].title).toContain("bài nộp thực hành");
      expect(items.every((item) => item.to.startsWith("/moderator"))).toBe(true);
    });
  });

  describe("getModeratorUnreadCount", () => {
    it("returns count of fallback notification items", () => {
      expect(getModeratorUnreadCount()).toBe(3);
    });
  });
});
