import { describe, expect, it } from "vitest";
import { getCompletedTaskCount } from "@/common/Header/MainHeader/streakData";

describe("streakData", () => {
  describe("getCompletedTaskCount", () => {
    it("counts tasks where current meets or exceeds target", () => {
      const tasks = [
        { id: "t1", current: 3, target: 3 },
        { id: "t2", current: 2, target: 5 },
        { id: "t3", current: 10, target: 1 },
      ];
      expect(getCompletedTaskCount(tasks)).toBe(2);
    });

    it("returns 0 for empty task list", () => {
      expect(getCompletedTaskCount([])).toBe(0);
    });

    it("does not count tasks below target", () => {
      const tasks = [{ id: "t1", current: 0, target: 1 }];
      expect(getCompletedTaskCount(tasks)).toBe(0);
    });
  });
});
