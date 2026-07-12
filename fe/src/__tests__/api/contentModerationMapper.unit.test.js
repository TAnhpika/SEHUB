import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  mapModerationPostDetail,
  mapModerationPostListItem,
  mapModerationUiStatus,
} from "@/api/contentModerationMapper";
import {
  mockModerationPostDto,
  mockRejectedModerationPostDto,
} from "../fixtures/mockApiDtos";

describe("contentModerationMapper", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-10T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("mapModerationUiStatus", () => {
    it("normalizes backend statuses to FE labels", () => {
      expect(mapModerationUiStatus("Published")).toBe("approved");
      expect(mapModerationUiStatus("Rejected")).toBe("rejected");
      expect(mapModerationUiStatus("Pending")).toBe("pending");
    });

    it("returns lowercase unknown statuses as-is", () => {
      expect(mapModerationUiStatus("archived")).toBe("archived");
    });
  });

  describe("mapModerationPostListItem", () => {
    it("maps pending post without moderation record", () => {
      const item = mapModerationPostListItem(mockModerationPostDto);
      expect(item.type).toBe("post");
      expect(item.status).toBe("pending");
      expect(item.authorName).toBe("Demo Premium");
      expect(item.studentId).toBe("@demo_student");
      expect(item.semester).toBe("Kỳ 4");
      expect(item.moderation).toBe(null);
      expect(item.coverImage?.url).toContain("/uploads/mod/cover.jpg");
      expect(item.inlineImages).toHaveLength(1);
    });

    it("maps rejected post with moderation history", () => {
      const item = mapModerationPostListItem(mockRejectedModerationPostDto);
      expect(item.status).toBe("rejected");
      expect(item.moderation?.moderatorName).toBe("@demo_moderator");
      expect(item.moderation?.reason).toContain("chưa đủ chi tiết");
      expect(item.moderation?.resubmitHint).toContain("gửi duyệt lại");
    });

    it("flags resubmission when pending but previously moderated", () => {
      const item = mapModerationPostListItem({
        ...mockModerationPostDto,
        status: "Pending",
        moderatedAt: "2026-07-09T20:00:00Z",
      });
      expect(item.resubmission).toBe(true);
    });
  });

  describe("mapModerationPostDetail", () => {
    it("includes full content on detail view", () => {
      const detail = mapModerationPostDetail(mockModerationPostDto);
      expect(detail.content).toBe(mockModerationPostDto.content);
      expect(detail.excerpt).toBe(mockModerationPostDto.excerpt);
    });
  });
});
