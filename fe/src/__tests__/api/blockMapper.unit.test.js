import { describe, expect, it } from "vitest";
import { blockedUserToConversation, mapBlockedUserListItem } from "@/api/blockMapper";

describe("blockMapper", () => {
  const mockBlockedDto = {
    userId: "blocked-user-99",
    conversationId: "conv-blocked-1",
    username: "spam_user",
    fullName: "Spam User",
    avatarUrl: "/uploads/avatars/spam.png",
    blockedAt: "2026-07-01T00:00:00Z",
  };

  describe("mapBlockedUserListItem", () => {
    it("maps blocked user to conversation-like list item", () => {
      const item = mapBlockedUserListItem(mockBlockedDto);
      expect(item.userId).toBe("blocked-user-99");
      expect(item.name).toBe("Spam User");
      expect(item.initials).toBe("SU");
      expect(item.preview).toBe("Đã chặn");
      expect(item.presenceTier).toBe("offline");
      expect(item.online).toBe(false);
    });

    it("falls back to username when full name is empty", () => {
      const item = mapBlockedUserListItem({ ...mockBlockedDto, fullName: "" });
      expect(item.name).toBe("spam_user");
    });
  });

  describe("blockedUserToConversation", () => {
    it("converts blocked list item to conversation entry", () => {
      const item = mapBlockedUserListItem(mockBlockedDto);
      const conv = blockedUserToConversation(item);
      expect(conv?.isBlockedEntry).toBe(true);
      expect(conv?.otherUserId).toBe("blocked-user-99");
      expect(conv?.id).toBe("conv-blocked-1");
    });

    it("uses userId as conversation id when conversationId is null", () => {
      const item = mapBlockedUserListItem({ ...mockBlockedDto, conversationId: null });
      const conv = blockedUserToConversation(item);
      expect(conv?.id).toBe("blocked-user-99");
    });

    it("returns null for null item", () => {
      expect(blockedUserToConversation(null)).toBe(null);
    });
  });
});
