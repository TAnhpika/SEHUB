import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  OFFLINE_AFTER_MS,
  applyPresenceUpdate,
  formatPresenceLabel,
  mapPresenceFields,
  presenceTier,
} from "@/utils/presenceStatus";

const FIXED_NOW = new Date("2026-07-10T12:00:00.000Z");

describe("presenceStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("presenceTier", () => {
    it("returns online when isOnline is true", () => {
      expect(presenceTier({ isOnline: true, lastSeenAt: null })).toBe("online");
    });

    it("returns recent when last seen within offline window", () => {
      const recent = new Date(FIXED_NOW.getTime() - 30 * 60 * 1000).toISOString();
      expect(presenceTier({ isOnline: false, lastSeenAt: recent })).toBe("recent");
    });

    it("returns offline when last seen exceeds OFFLINE_AFTER_MS", () => {
      const stale = new Date(FIXED_NOW.getTime() - OFFLINE_AFTER_MS - 1000).toISOString();
      expect(presenceTier({ isOnline: false, lastSeenAt: stale })).toBe("offline");
    });

    it("returns offline when lastSeenAt is missing or invalid", () => {
      expect(presenceTier({ isOnline: false })).toBe("offline");
      expect(presenceTier({ isOnline: false, lastSeenAt: "invalid" })).toBe("offline");
    });
  });

  describe("formatPresenceLabel", () => {
    it('returns "Đang online" for online users', () => {
      expect(formatPresenceLabel({ isOnline: true })).toBe("Đang online");
    });

    it("returns activity relative time for recent users", () => {
      const fiveMinAgo = new Date(FIXED_NOW.getTime() - 5 * 60 * 1000).toISOString();
      expect(formatPresenceLabel({ isOnline: false, lastSeenAt: fiveMinAgo })).toBe(
        "Hoạt động 5 phút trước",
      );
    });

    it('returns "Ngoại tuyến" for stale or missing last seen', () => {
      const stale = new Date(FIXED_NOW.getTime() - OFFLINE_AFTER_MS).toISOString();
      expect(formatPresenceLabel({ isOnline: false, lastSeenAt: stale })).toBe("Ngoại tuyến");
      expect(formatPresenceLabel({ isOnline: false })).toBe("Ngoại tuyến");
    });
  });

  describe("mapPresenceFields", () => {
    it("maps camelCase DTO fields", () => {
      const mapped = mapPresenceFields({
        otherUserIsOnline: true,
        otherUserLastSeenAt: "2026-07-10T11:00:00Z",
      });
      expect(mapped.online).toBe(true);
      expect(mapped.presenceTier).toBe("online");
      expect(mapped.presenceLabel).toBe("Đang online");
    });

    it("maps PascalCase DTO fields from .NET API", () => {
      const mapped = mapPresenceFields({
        OtherUserIsOnline: false,
        OtherUserLastSeenAt: "2026-07-10T11:55:00Z",
      });
      expect(mapped.online).toBe(false);
      expect(mapped.presenceTier).toBe("recent");
    });
  });

  describe("applyPresenceUpdate", () => {
    const conversation = {
      id: "conv-1",
      otherUserId: "user-42",
      online: false,
      lastSeenAt: null,
      presenceTier: "offline",
      presenceLabel: "Ngoại tuyến",
    };

    it("updates conversation when userId matches otherUserId", () => {
      const updated = applyPresenceUpdate(conversation, {
        userId: "user-42",
        isOnline: true,
        lastSeenAt: "2026-07-10T12:00:00Z",
      });
      expect(updated.online).toBe(true);
      expect(updated.presenceTier).toBe("online");
      expect(updated.presenceLabel).toBe("Đang online");
    });

    it("supports PascalCase presence DTO keys", () => {
      const updated = applyPresenceUpdate(conversation, {
        UserId: "user-42",
        IsOnline: false,
        LastSeenAt: "2026-07-10T11:50:00Z",
      });
      expect(updated.presenceTier).toBe("recent");
    });

    it("returns original conversation when userId does not match", () => {
      const unchanged = applyPresenceUpdate(conversation, {
        userId: "other-user",
        isOnline: true,
      });
      expect(unchanged).toBe(conversation);
    });

    it("returns original when conversation or dto is null", () => {
      expect(applyPresenceUpdate(null, { userId: "x" })).toBe(null);
      expect(applyPresenceUpdate(conversation, null)).toBe(conversation);
    });
  });
});
