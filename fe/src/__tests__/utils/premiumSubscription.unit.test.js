import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatPremiumExpiryDate,
  formatPremiumStatusSummary,
  getPremiumDaysRemaining,
  isPremiumExpiringSoon,
} from "@/utils/premiumSubscription";

const FIXED_NOW = new Date("2026-07-10T12:00:00.000Z");

describe("premiumSubscription", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getPremiumDaysRemaining", () => {
    it("returns ceil days until expiry", () => {
      const expiresAt = "2026-07-20T00:00:00.000Z";
      expect(getPremiumDaysRemaining(expiresAt)).toBe(10);
    });

    it("returns 0 when already expired", () => {
      expect(getPremiumDaysRemaining("2026-07-01T00:00:00.000Z")).toBe(0);
    });

    it("returns null for missing or invalid dates", () => {
      expect(getPremiumDaysRemaining(null)).toBe(null);
      expect(getPremiumDaysRemaining("not-a-date")).toBe(null);
    });
  });

  describe("formatPremiumExpiryDate", () => {
    it("formats valid expiry in vi-VN", () => {
      const formatted = formatPremiumExpiryDate("2026-12-31T23:59:59.000Z");
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('returns em dash for invalid input', () => {
      expect(formatPremiumExpiryDate(null)).toBe("—");
      expect(formatPremiumExpiryDate("bad")).toBe("—");
    });
  });

  describe("formatPremiumStatusSummary", () => {
    it("returns null when subscription is inactive", () => {
      expect(formatPremiumStatusSummary({ isActive: false, expiresAt: "2026-12-31" })).toBe(null);
    });

    it("returns active message when days cannot be computed", () => {
      expect(formatPremiumStatusSummary({ isActive: true, expiresAt: null })).toBe(
        "Premium đang hoạt động",
      );
    });

    it("returns today expiry message when days is 0", () => {
      expect(
        formatPremiumStatusSummary({
          isActive: true,
          expiresAt: "2026-07-10T10:00:00.000Z",
        }),
      ).toBe("Premium hết hạn hôm nay");
    });

    it("returns remaining days and formatted expiry", () => {
      const summary = formatPremiumStatusSummary({
        isActive: true,
        expiresAt: "2026-07-20T00:00:00.000Z",
      });
      expect(summary).toContain("Premium còn 10 ngày");
      expect(summary).toContain("hết hạn");
    });
  });

  describe("isPremiumExpiringSoon", () => {
    it("returns true when within threshold and not expired", () => {
      expect(isPremiumExpiringSoon("2026-07-15T00:00:00.000Z", 7)).toBe(true);
    });

    it("returns false when more than threshold days remain", () => {
      expect(isPremiumExpiringSoon("2026-08-10T00:00:00.000Z", 7)).toBe(false);
    });

    it("returns false when already expired or invalid", () => {
      expect(isPremiumExpiringSoon("2026-07-01T00:00:00.000Z")).toBe(false);
      expect(isPremiumExpiringSoon(null)).toBe(false);
    });
  });
});
