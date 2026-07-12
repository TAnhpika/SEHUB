import { describe, expect, it } from "vitest";
import { mapFollowListItem, mapUserSearchResult } from "@/api/usersMapper";

describe("usersMapper", () => {
  const mockSearchDto = {
    userId: "user-42",
    username: "peer_student",
    fullName: "Nguyễn Văn B",
    avatarUrl: "/uploads/avatars/peer.png",
    levelName: "Silver",
    isFollowing: true,
  };

  describe("mapUserSearchResult", () => {
    it("maps search result with resolved avatar and level", () => {
      const user = mapUserSearchResult(mockSearchDto);
      expect(user.id).toBe("user-42");
      expect(user.displayName).toBe("Nguyễn Văn B");
      expect(user.initial).toBe("N");
      expect(user.level).toBe("SILVER");
      expect(user.isFollowing).toBe(true);
      expect(user.avatarUrl).toContain("localhost:5006");
    });

    it("falls back display name to username", () => {
      const user = mapUserSearchResult({ ...mockSearchDto, fullName: "" });
      expect(user.displayName).toBe("peer_student");
    });
  });

  describe("mapFollowListItem", () => {
    it("reuses mapUserSearchResult for follow list entries", () => {
      const item = mapFollowListItem(mockSearchDto);
      expect(item).toEqual(mapUserSearchResult(mockSearchDto));
    });
  });
});
