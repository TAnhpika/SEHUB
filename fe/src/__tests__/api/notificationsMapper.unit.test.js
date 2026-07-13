import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mapNotificationItem, mapNotificationPage } from "@/api/notificationsMapper";
import { mockNotificationDto } from "../fixtures/mockApiDtos";

describe("notificationsMapper", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-10T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("mapNotificationItem", () => {
    it("maps notification with relative time and read flag", () => {
      const item = mapNotificationItem(mockNotificationDto);
      expect(item.id).toBe("notif-001");
      expect(item.type).toBe("comment");
      expect(item.read).toBe(false);
      expect(item.time).toBeTruthy();
      expect(item.linkUrl).toBe("/community/post/post-001");
    });

    it("rewrites social notifications to profile links", () => {
      const follow = mapNotificationItem({
        ...mockNotificationDto,
        type: "follow",
        linkUrl: "/home/friends",
        actorUsername: "peer_student",
      });
      expect(follow.linkUrl).toBe("/profile/peer_student");

      const friendRequest = mapNotificationItem({
        ...mockNotificationDto,
        type: "friendrequest",
        actorUsername: "peer_student",
      });
      expect(friendRequest.linkUrl).toBe("/profile/peer_student");
    });

    it("nullifies deprecated /home/friends link", () => {
      const item = mapNotificationItem({
        ...mockNotificationDto,
        type: "system",
        linkUrl: "/home/friends",
        actorUsername: null,
      });
      expect(item.linkUrl).toBe(null);
    });
  });

  describe("mapNotificationPage", () => {
    it("maps paginated notification response", () => {
      const page = mapNotificationPage({
        items: [mockNotificationDto],
        totalCount: 10,
      });
      expect(page.items).toHaveLength(1);
      expect(page.totalCount).toBe(10);
    });

    it("defaults totalCount to items length when missing", () => {
      const page = mapNotificationPage({ items: [mockNotificationDto] });
      expect(page.totalCount).toBe(1);
    });
  });
});
