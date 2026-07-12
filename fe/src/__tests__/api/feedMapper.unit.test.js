import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatCommentTime,
  mapComment,
  mapPostDetail,
  mapPostListItem,
} from "@/api/feedMapper";
import { mockPostListDto } from "../fixtures/mockApiDtos";

describe("feedMapper", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-10T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("formatCommentTime", () => {
    it("formats comment timestamp as HH:mm DD/MM/YYYY", () => {
      const formatted = formatCommentTime("2026-07-10T08:30:00Z");
      expect(formatted).toMatch(/^\d{2}:\d{2} \d{2}\/\d{2}\/\d{4}$/);
    });

    it("returns empty string for invalid date", () => {
      expect(formatCommentTime("invalid")).toBe("");
    });
  });

  describe("mapPostListItem", () => {
    it("maps post list item with author, stats, and resolved images", () => {
      const post = mapPostListItem(mockPostListDto);
      expect(post.title).toBe(mockPostListDto.title);
      expect(post.author.name).toBe("Demo Premium");
      expect(post.author.initial).toBe("D");
      expect(post.likes).toBe(15);
      expect(post.isFeatured).toBe(true);
      expect(post.coverImageUrl).toContain("localhost:5006");
      expect(post.images).toHaveLength(1);
      expect(post.timeAgo).toBeTruthy();
      expect(post.publishedAt).toContain("tháng");
    });

    it("uses unknown author fallback", () => {
      const post = mapPostListItem({ ...mockPostListDto, author: null });
      expect(post.author.username).toBe("unknown");
    });
  });

  describe("mapPostDetail", () => {
    it("extends list item with full content and comments", () => {
      const comments = [
        {
          id: "c1",
          content: "Hay quá!",
          createdAt: "2026-07-09T10:00:00Z",
          author: mockPostListDto.author,
        },
      ];
      const detail = mapPostDetail(
        { ...mockPostListDto, content: "Full body content here", viewCount: 200 },
        comments.map(mapComment),
      );
      expect(detail.body).toBe("Full body content here");
      expect(detail.views).toBe(200);
      expect(detail.commentsList).toHaveLength(1);
    });
  });

  describe("mapComment", () => {
    it("maps nested comment replies recursively", () => {
      const comment = mapComment({
        id: "c-root",
        content: "Root",
        createdAt: "2026-07-09T10:00:00Z",
        author: mockPostListDto.author,
        replies: [
          {
            id: "c-reply",
            content: "Reply",
            createdAt: "2026-07-09T10:05:00Z",
            author: mockPostListDto.author,
          },
        ],
      });
      expect(comment.replies).toHaveLength(1);
      expect(comment.replies[0].content).toBe("Reply");
    });
  });
});
