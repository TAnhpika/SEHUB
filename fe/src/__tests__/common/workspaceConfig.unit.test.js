import { describe, expect, it } from "vitest";
import {
  WORKSPACES,
  getAccessibleWorkspaces,
  getCurrentWorkspaceId,
} from "@/common/WorkspaceSwitcher/workspaceConfig";
import {
  mockAdmin,
  mockFreeStudent,
  mockModerator,
} from "../fixtures/mockUsers";

describe("workspaceConfig", () => {
  describe("WORKSPACES", () => {
    it("defines admin, moderator, and student workspaces", () => {
      expect(WORKSPACES.map((w) => w.id)).toEqual(["admin", "moderator", "student"]);
      expect(WORKSPACES[0].to).toBe("/admin");
      expect(WORKSPACES[1].to).toBe("/moderator/reports");
      expect(WORKSPACES[2].to).toBe("/home");
    });
  });

  describe("getCurrentWorkspaceId", () => {
    it("detects workspace from pathname prefix", () => {
      expect(getCurrentWorkspaceId("/admin/users")).toBe("admin");
      expect(getCurrentWorkspaceId("/moderator/reports")).toBe("moderator");
      expect(getCurrentWorkspaceId("/home/my-learning")).toBe("student");
      expect(getCurrentWorkspaceId("/community")).toBe("student");
    });
  });

  describe("getAccessibleWorkspaces", () => {
    it("returns all workspaces for admin", () => {
      expect(getAccessibleWorkspaces(mockAdmin)).toHaveLength(3);
    });

    it("hides admin workspace from moderator", () => {
      const workspaces = getAccessibleWorkspaces(mockModerator);
      expect(workspaces.map((w) => w.id)).toEqual(["moderator", "student"]);
    });

    it("returns only student workspace for students and guests", () => {
      expect(getAccessibleWorkspaces(mockFreeStudent)).toHaveLength(1);
      expect(getAccessibleWorkspaces(mockFreeStudent)[0].id).toBe("student");
      expect(getAccessibleWorkspaces(null)[0].id).toBe("student");
    });
  });
});
