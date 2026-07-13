import { describe, expect, it } from "vitest";
import { ACTION_LOADING } from "@/utils/actionLoadingLabels";

describe("actionLoadingLabels", () => {
  describe("ACTION_LOADING constants", () => {
    it("defines Vietnamese loading labels for all moderator/admin actions", () => {
      expect(ACTION_LOADING.approve).toBe("Đang duyệt...");
      expect(ACTION_LOADING.reject).toBe("Đang từ chối...");
      expect(ACTION_LOADING.ban).toBe("Đang khóa...");
      expect(ACTION_LOADING.unban).toBe("Đang mở khóa...");
      expect(ACTION_LOADING.save).toBe("Đang lưu...");
      expect(ACTION_LOADING.submit).toBe("Đang gửi...");
    });

    it("covers escalation, scan, and apply workflows", () => {
      expect(ACTION_LOADING.escalate).toBe("Đang chuyển...");
      expect(ACTION_LOADING.scan).toBe("Đang quét...");
      expect(ACTION_LOADING.apply).toBe("Đang áp dụng...");
    });

    it("has a non-empty string for every defined action key", () => {
      Object.entries(ACTION_LOADING).forEach(([key, label]) => {
        expect(typeof label).toBe("string");
        expect(label.length).toBeGreaterThan(0);
        expect(key).toMatch(/^[a-z]+$/);
      });
    });
  });
});
