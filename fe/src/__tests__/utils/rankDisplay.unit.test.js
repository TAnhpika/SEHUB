import { describe, expect, it } from "vitest";
import {
  deriveNextLevelLabel,
  getRankBadgeClass,
  getRankBadgeStyleClass,
  getRankDisplay,
  getRankIconClass,
  normalizeRankKey,
} from "@/utils/rankDisplay";

const mockRankStyles = {
  iconBronze: "styles-iconBronze",
  iconSilver: "styles-iconSilver",
  iconGold: "styles-iconGold",
  iconPlatinum: "styles-iconPlatinum",
  badgeBronze: "styles-badgeBronze",
  badgeSilver: "styles-badgeSilver",
  badgeGold: "styles-badgeGold",
  badgePlatinum: "styles-badgePlatinum",
};

describe("rankDisplay", () => {
  describe("normalizeRankKey", () => {
    it("accepts valid rank keys case-insensitively", () => {
      expect(normalizeRankKey("Gold")).toBe("gold");
      expect(normalizeRankKey(" PLATINUM ")).toBe("platinum");
      expect(normalizeRankKey("diamond")).toBe("diamond");
    });

    it("returns null for unknown or empty values", () => {
      expect(normalizeRankKey("master")).toBe(null);
      expect(normalizeRankKey("")).toBe(null);
      expect(normalizeRankKey(null)).toBe(null);
    });
  });

  describe("getRankDisplay", () => {
    it("returns config for each valid rank", () => {
      expect(getRankDisplay("bronze").label).toBe("Bronze");
      expect(getRankDisplay("silver").tone).toBe("silver");
      expect(getRankDisplay("gold").badgeClass).toBe("rankGold");
      expect(getRankDisplay("platinum").label).toBe("Platinum");
    });

    it("maps diamond to platinum styling", () => {
      const diamond = getRankDisplay("diamond");
      expect(diamond.label).toBe("Diamond");
      expect(diamond.tone).toBe("platinum");
      expect(diamond.badgeClass).toBe("rankPlatinum");
    });

    it("falls back to bronze for invalid rank", () => {
      const fallback = getRankDisplay("unknown");
      expect(fallback.label).toBe("Bronze");
      expect(fallback.badgeClass).toBe("rankBronze");
    });
  });

  describe("deriveNextLevelLabel", () => {
    it("returns next tier label in progression order", () => {
      expect(deriveNextLevelLabel("bronze")).toBe("Silver");
      expect(deriveNextLevelLabel("silver")).toBe("Gold");
      expect(deriveNextLevelLabel("gold")).toBe("Platinum");
      expect(deriveNextLevelLabel("platinum")).toBe("Diamond");
    });

    it("returns null at max rank or invalid input", () => {
      expect(deriveNextLevelLabel("diamond")).toBe(null);
      expect(deriveNextLevelLabel("invalid")).toBe(null);
    });
  });

  describe("CSS class helpers", () => {
    it("getRankBadgeClass returns badge class name", () => {
      expect(getRankBadgeClass("gold")).toBe("rankGold");
    });

    it("getRankIconClass resolves from rankStyles map", () => {
      expect(getRankIconClass("bronze", mockRankStyles)).toBe("styles-iconBronze");
      expect(getRankIconClass("invalid", mockRankStyles)).toBe("styles-iconBronze");
    });

    it("getRankBadgeStyleClass returns empty string when style missing", () => {
      expect(getRankBadgeStyleClass("gold", {})).toBe("");
      expect(getRankBadgeStyleClass("gold", mockRankStyles)).toBe("styles-badgeGold");
    });
  });
});
