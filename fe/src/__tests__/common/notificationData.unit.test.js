import { describe, expect, it } from "vitest";
import { NOTIFICATION_META } from "@/common/Header/MainHeader/notificationData";

describe("notificationData", () => {
  describe("NOTIFICATION_META", () => {
    it("defines label and tone for all known notification types", () => {
      const expectedTypes = [
        "comment",
        "exam",
        "streak",
        "follow",
        "friendrequest",
        "friendaccepted",
        "like",
        "token",
        "badge",
        "moderation",
        "examreview",
        "mention",
        "practiceresult",
        "refund",
      ];

      for (const type of expectedTypes) {
        expect(NOTIFICATION_META[type]).toBeDefined();
        expect(NOTIFICATION_META[type].label).toBeTruthy();
        expect(["blue", "purple", "amber"]).toContain(NOTIFICATION_META[type].tone);
      }
    });

    it("groups moderation and exam review under purple exam labels", () => {
      expect(NOTIFICATION_META.moderation.label).toBe("Kiểm duyệt");
      expect(NOTIFICATION_META.examreview.label).toBe("Đề thi");
      expect(NOTIFICATION_META.moderation.tone).toBe("purple");
    });

    it("uses amber tone for streak and token notifications", () => {
      expect(NOTIFICATION_META.streak.tone).toBe("amber");
      expect(NOTIFICATION_META.token.tone).toBe("amber");
      expect(NOTIFICATION_META.practiceresult.tone).toBe("amber");
    });
  });
});
