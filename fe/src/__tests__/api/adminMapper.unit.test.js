import { describe, expect, it } from "vitest";
import {
  mapAdminUserDetail,
  mapAdminUserListItem,
  mapAdminVoucherListItem,
  mapRankTiersToUpdateLevelsRequest,
  mergeDashboardStats,
} from "@/api/adminMapper";
import {
  mockAdminUserDto,
  mockBannedAdminUserDto,
  mockDashboardPayload,
  mockDashboardStatsDto,
} from "../fixtures/mockExtendedDtos";

describe("adminMapper", () => {
  describe("mapAdminUserListItem", () => {
    it("maps premium student with active status", () => {
      const user = mapAdminUserListItem(mockAdminUserDto);
      expect(user.username).toBe("demo_student");
      expect(user.role).toBe("student");
      expect(user.plan).toBe("Premium");
      expect(user.status).toBe("active");
      expect(user.points).toBe(1250);
    });

    it("maps banned user status", () => {
      const user = mapAdminUserListItem(mockBannedAdminUserDto);
      expect(user.status).toBe("banned");
      expect(user.plan).toBe("Premium");
    });

    it("shows dash plan for staff roles", () => {
      const user = mapAdminUserListItem({ ...mockAdminUserDto, role: "Admin" });
      expect(user.role).toBe("admin");
      expect(user.plan).toBe("—");
    });
  });

  describe("mapAdminUserDetail", () => {
    it("extends list item with ban and activity metadata", () => {
      const detail = mapAdminUserDetail(mockBannedAdminUserDto);
      expect(detail.banReason).toBe("Spam");
      expect(detail.bannedAt).not.toBe("—");
    });

    it("includes trust breakdown when provided", () => {
      const detail = mapAdminUserDetail({
        ...mockAdminUserDto,
        trust: {
          score: 85,
          tier: "high",
          conductScore: 90,
          competenceScore: 80,
          engagementScore: 85,
          confidence: 0.9,
        },
      });
      expect(detail.trust?.score).toBe(85);
      expect(detail.trust?.tier).toBe("high");
    });
  });

  describe("mapRankTiersToUpdateLevelsRequest", () => {
    it("maps FE rank tiers to backend levels payload", () => {
      const payload = mapRankTiersToUpdateLevelsRequest([
        { name: "Bronze", minPoints: 0, voucherDiscount: 0 },
        { name: "Gold", minPoints: 1000, voucherDiscount: 10 },
      ]);
      expect(payload.levels).toHaveLength(2);
      expect(payload.levels[1]).toEqual({
        name: "Gold",
        minPoints: 1000,
        voucherPercent: 10,
      });
    });
  });

  describe("mergeDashboardStats", () => {
    it("merges live API stats into mock dashboard payload", () => {
      const merged = mergeDashboardStats(mockDashboardPayload, mockDashboardStatsDto, {
        documentCount: 42,
        pendingReports: 5,
      });

      const usersStat = merged.stats.find((s) => s.id === "users");
      expect(usersStat?.value).toBe("500");
      expect(merged.studentPlan.premium.count).toBe(120);
      expect(merged.studentPlan.basic.count).toBe(380);

      const reportsStat = merged.stats.find((s) => s.id === "reports");
      expect(reportsStat?.value).toBe("5");
      expect(reportsStat?.urgent).toBe(true);
    });

    it("returns original payload when stats is null", () => {
      expect(mergeDashboardStats(mockDashboardPayload, null)).toBe(mockDashboardPayload);
    });
  });

  describe("mapAdminVoucherListItem", () => {
    it("maps voucher with lowercase status", () => {
      const voucher = mapAdminVoucherListItem({
        id: "v-1",
        userId: "u-1",
        username: "demo_student",
        displayName: "Demo",
        levelId: "gold",
        levelName: "Gold",
        discountPercent: 15,
        status: "Active",
        grantedAt: "2026-07-01T10:00:00Z",
        expiresAt: "2026-12-31T00:00:00Z",
      });
      expect(voucher.status).toBe("active");
      expect(voucher.discountPercent).toBe(15);
      expect(voucher.grantedAt).not.toBe("—");
    });
  });
});
