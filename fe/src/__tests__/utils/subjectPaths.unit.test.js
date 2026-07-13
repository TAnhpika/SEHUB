import { describe, expect, it } from "vitest";
import {
  MY_LEARNING_HOME_PATH,
  getSubjectCatalogPath,
  getSubjectNavLinks,
  getSubjectScopeFromPath,
  isHomeSubjectArea,
  isSubjectContentPath,
  mapCommunityPathToHome,
  mapHomeSubjectPathToCommunity,
} from "@/utils/subjectPaths";
import {
  communityCatalogPaths,
  homeCatalogPaths,
  legacyPracticePaths,
  nonSubjectPaths,
  subjectDetailSamples,
} from "../fixtures/mockSubjectRoutes";

describe("subjectPaths", () => {
  describe("getSubjectCatalogPath", () => {
    describe("happy paths", () => {
      it("builds community catalog paths for review, practice, and documents", () => {
        expect(getSubjectCatalogPath("review")).toBe(communityCatalogPaths.review);
        expect(getSubjectCatalogPath("practice")).toBe(communityCatalogPaths.practice);
        expect(getSubjectCatalogPath("documents")).toBe(communityCatalogPaths.documents);
      });

      it("builds home-scoped catalog paths when scope is home", () => {
        expect(getSubjectCatalogPath("review", "home")).toBe(homeCatalogPaths.review);
        expect(getSubjectCatalogPath("practice", "home")).toBe(homeCatalogPaths.practice);
        expect(getSubjectCatalogPath("documents", "home")).toBe(homeCatalogPaths.documents);
      });
    });

    describe("edge cases", () => {
      it("defaults scope to community when omitted", () => {
        expect(getSubjectCatalogPath("review")).toBe("/community/final-exam");
      });
    });
  });

  describe("getSubjectScopeFromPath", () => {
    it("detects home scope from /home/ prefix", () => {
      expect(getSubjectScopeFromPath("/home/final-exam")).toBe("home");
      expect(getSubjectScopeFromPath("/home/my-learning")).toBe("home");
    });

    it("defaults to community for non-home paths", () => {
      expect(getSubjectScopeFromPath("/community/final-exam")).toBe("community");
      expect(getSubjectScopeFromPath("/")).toBe("community");
      expect(getSubjectScopeFromPath("/login")).toBe("community");
    });
  });

  describe("isHomeSubjectArea", () => {
    it("matches home subject prefixes and nested detail routes", () => {
      expect(isHomeSubjectArea(homeCatalogPaths.review)).toBe(true);
      expect(isHomeSubjectArea(subjectDetailSamples.homePractice)).toBe(true);
      expect(isHomeSubjectArea(MY_LEARNING_HOME_PATH)).toBe(true);
      expect(isHomeSubjectArea(`${MY_LEARNING_HOME_PATH}/tab`)).toBe(true);
    });

    it("matches legacy pratical-exam spelling under /home", () => {
      expect(isHomeSubjectArea(legacyPracticePaths.home)).toBe(true);
    });

    it("returns false for community and unrelated routes", () => {
      expect(isHomeSubjectArea(communityCatalogPaths.review)).toBe(false);
      nonSubjectPaths.forEach((path) => {
        expect(isHomeSubjectArea(path)).toBe(false);
      });
    });
  });

  describe("isSubjectContentPath", () => {
    it("includes both community and home subject content areas", () => {
      expect(isSubjectContentPath(communityCatalogPaths.documents)).toBe(true);
      expect(isSubjectContentPath(subjectDetailSamples.communityReview)).toBe(true);
      expect(isSubjectContentPath(subjectDetailSamples.homeDocuments)).toBe(true);
      expect(isSubjectContentPath(legacyPracticePaths.community)).toBe(true);
    });

    it("excludes my-learning and non-subject routes", () => {
      expect(isSubjectContentPath(MY_LEARNING_HOME_PATH)).toBe(false);
      expect(isSubjectContentPath("/home/messages")).toBe(false);
      expect(isSubjectContentPath("/admin")).toBe(false);
    });
  });

  describe("mapHomeSubjectPathToCommunity", () => {
    it("rewrites /home subject paths to /community equivalents", () => {
      expect(mapHomeSubjectPathToCommunity(homeCatalogPaths.review)).toBe(
        communityCatalogPaths.review,
      );
      expect(mapHomeSubjectPathToCommunity(subjectDetailSamples.homePractice)).toBe(
        "/community/practical-exam/SWE201c/PE-01",
      );
    });

    it("returns null for my-learning (requires auth, no guest mirror)", () => {
      expect(mapHomeSubjectPathToCommunity(MY_LEARNING_HOME_PATH)).toBe(null);
      expect(mapHomeSubjectPathToCommunity(`${MY_LEARNING_HOME_PATH}/history`)).toBe(null);
    });

    it("returns null for paths outside home subject area", () => {
      expect(mapHomeSubjectPathToCommunity("/home")).toBe(null);
      expect(mapHomeSubjectPathToCommunity("/community/final-exam")).toBe(null);
      expect(mapHomeSubjectPathToCommunity("/login")).toBe(null);
    });
  });

  describe("mapCommunityPathToHome", () => {
    it("maps /community root to /home", () => {
      expect(mapCommunityPathToHome("/community")).toBe("/home");
    });

    it("maps nested community paths to home equivalents", () => {
      expect(mapCommunityPathToHome(communityCatalogPaths.practice)).toBe(
        homeCatalogPaths.practice,
      );
      expect(mapCommunityPathToHome(subjectDetailSamples.communityReview)).toBe(
        "/home/final-exam/PRF192/FE-PRF192-SU2026-1",
      );
    });

    it("returns null for non-community paths", () => {
      expect(mapCommunityPathToHome("/home")).toBe(null);
      expect(mapCommunityPathToHome("/")).toBe(null);
    });
  });

  describe("getSubjectNavLinks", () => {
    it("returns three base links for community scope", () => {
      const links = getSubjectNavLinks("community");
      expect(links).toHaveLength(3);
      expect(links.map((l) => l.key)).toEqual(["review", "practice", "documents"]);
      expect(links[0].to).toBe("/community/final-exam");
    });

    it("adds learning history link for premium home users only", () => {
      const freeLinks = getSubjectNavLinks("home", { isPremium: false });
      expect(freeLinks).toHaveLength(3);

      const premiumLinks = getSubjectNavLinks("home", { isPremium: true });
      expect(premiumLinks).toHaveLength(4);
      expect(premiumLinks[3]).toEqual({
        to: MY_LEARNING_HOME_PATH,
        label: "Lịch sử học tập",
        key: "history",
      });
    });

    it("never adds history link for community scope even when premium", () => {
      const links = getSubjectNavLinks("community", { isPremium: true });
      expect(links).toHaveLength(3);
    });
  });
});
