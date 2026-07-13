import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  computeProgress,
  mapAiTokenStatusDto,
  mapBadgesForSection,
  mapFormToUpdateRequest,
  mapProfileActivityToHeatmap,
  mapProfileCard,
  mapProfileRecentPost,
  mapProfileStatsToAuthUser,
  mapProfileToForm,
} from "@/api/profileMapper";
import { mockPremiumStudent } from "../fixtures/mockUsers";
import { mockProfileDto, mockProfileStatsDto } from "../fixtures/mockApiDtos";

describe("profileMapper", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-10T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("computeProgress", () => {
    it("calculates points to next level and progress percent", () => {
      expect(computeProgress(750, 1000)).toEqual({
        pointsToNext: 250,
        levelProgress: 75,
      });
    });

    it("caps progress at 100 when next level is null or zero", () => {
      expect(computeProgress(500, null)).toEqual({ pointsToNext: 0, levelProgress: 100 });
      expect(computeProgress(500, 0)).toEqual({ pointsToNext: 0, levelProgress: 100 });
    });

    it("treats negative points as zero", () => {
      expect(computeProgress(-10, 1000).levelProgress).toBe(0);
    });
  });

  describe("mapBadgesForSection", () => {
    const catalog = [
      { id: "b1", code: "first_post", title: "First Post", description: "Đăng bài đầu" },
      { id: "b2", code: "streak_7", title: "7 Day Streak", description: "Streak 7 ngày" },
    ];

    it("marks badges unlocked by code or title match", () => {
      const badges = mapBadgesForSection(catalog, [
        { code: "first_post", name: "First Post" },
      ]);
      expect(badges[0].unlocked).toBe(true);
      expect(badges[1].unlocked).toBe(false);
    });
  });

  describe("mapProfileRecentPost", () => {
    it("maps post stats and formatted date", () => {
      const post = mapProfileRecentPost({
        id: "p1",
        title: "Hello",
        createdAt: "2026-07-01T00:00:00Z",
        commentCount: 2,
        likeCount: 5,
      });
      expect(post.comments).toBe(2);
      expect(post.likes).toBe(5);
      expect(post.date).toMatch(/\d+\/\d+\/\d+/);
    });
  });

  describe("mapProfileCard", () => {
    it("maps profile card with stats DTO progress override", () => {
      const card = mapProfileCard(mockProfileDto, mockProfileStatsDto);
      expect(card.displayName).toBe("Demo Premium");
      expect(card.level).toBe("GOLD");
      expect(card.nextLevel).toBe("Platinum");
      expect(card.levelProgress).toBe(62);
      expect(card.pointsToNext).toBe(750);
      expect(card.stats.exams).toBe(12);
      expect(card.avatarUrl).toContain("localhost:5006");
    });

    it("computes progress locally when stats DTO lacks server progress", () => {
      const card = mapProfileCard(mockProfileDto, { points: 500, nextLevelPoints: 1000 });
      expect(card.levelProgress).toBe(50);
      expect(card.pointsToNext).toBe(500);
    });
  });

  describe("mapProfileStatsToAuthUser", () => {
    it("merges stats into existing auth user", () => {
      const merged = mapProfileStatsToAuthUser(mockPremiumStudent, mockProfileStatsDto);
      expect(merged.points).toBe(1250);
      expect(merged.level).toBe("Gold");
      expect(merged.streak).toBe(7);
      expect(merged.levelProgress).toBe(62);
    });

    it("returns original user when stats or user is missing", () => {
      expect(mapProfileStatsToAuthUser(null, mockProfileStatsDto)).toBe(null);
      expect(mapProfileStatsToAuthUser(mockPremiumStudent, null)).toBe(mockPremiumStudent);
    });
  });

  describe("mapProfileToForm and mapFormToUpdateRequest", () => {
    it("maps profile DTO to editable form fields", () => {
      const form = mapProfileToForm(mockProfileDto, mockPremiumStudent);
      expect(form.email).toBe(mockPremiumStudent.email);
      expect(form.fullName).toBe("Demo Premium");
      expect(form.major).toBe("SE");
    });

    it("maps form back to API update request", () => {
      const request = mapFormToUpdateRequest({
        fullName: "  New Name  ",
        bio: "Updated bio",
        major: "AI",
        gender: "female",
        dateOfBirth: "",
        phone: "  ",
        address: "",
      });
      expect(request.displayName).toBe("New Name");
      expect(request.phone).toBe(null);
      expect(request.dateOfBirth).toBe(null);
    });
  });

  describe("mapProfileActivityToHeatmap", () => {
    it("builds heatmap grid from activity days", () => {
      const heatmap = mapProfileActivityToHeatmap({
        totalActivities: 5,
        days: [
          { date: "2026-07-08", level: 2, count: 3 },
          { date: "2026-07-09", level: 1, count: 1 },
        ],
      });
      expect(heatmap?.totalActivities).toBe(5);
      expect(heatmap?.cells.length).toBeGreaterThan(0);
    });

    it("returns null when no activity days", () => {
      expect(mapProfileActivityToHeatmap({ days: [] })).toBe(null);
      expect(mapProfileActivityToHeatmap(null)).toBe(null);
    });
  });

  describe("mapAiTokenStatusDto", () => {
    it("normalizes numeric and boolean token fields", () => {
      const snapshot = mapAiTokenStatusDto({
        limit: "1000",
        used: 50,
        remaining: 950,
        canExplain: 1,
        canChat: true,
      });
      expect(snapshot).toEqual({
        limit: 1000,
        used: 50,
        remaining: 950,
        costExplain: 10,
        costChat: 10,
        canExplain: true,
        canChat: true,
      });
    });
  });
});
