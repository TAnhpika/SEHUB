import { describe, expect, it } from "vitest";
import {
  mapAdminAuditLogItem,
  mapAdminBannedUser,
  mapAdminExamListItem,
  mapAdminPaymentListItem,
  mapAdminReportListItem,
  mapAdminReviewQuestion,
  mapAdminUserActivityItem,
  mapBadgeAdminDto,
  mapBadgeToCreateRequest,
  mapBadgeToUpdateRequest,
  mapDashboardCharts,
  mapLevelConfigToRankTier,
  mapPaymentAuditLogItem,
  mapPointRuleAdminDto,
  mapPointRuleToCreateRequest,
  mapPointRuleToUpdateRequest,
  mapViolatingUser,
  mapViolatingUserDetail,
} from "@/api/adminMapper";
import {
  mockAdminExamDto,
  mockAdminPaymentDto,
  mockAdminReportDto,
  mockBadgeAdminDto,
  mockBannedUserDto,
  mockDashboardChartsDto,
  mockPaymentAuditLogDto,
  mockPointRuleDto,
  mockViolatingUserDetailDto,
  mockViolatingUserDto,
} from "../fixtures/mockAdminDtos";

describe("adminMapper (extended)", () => {
  describe("mapAdminExamListItem", () => {
    it("maps final exam with attachments and display fields", () => {
      const item = mapAdminExamListItem(mockAdminExamDto);
      expect(item.typeKey).toBe("final");
      expect(item.type).toBe("Cuối kỳ");
      expect(item.subjectCode).toBe("PRF192");
      expect(item.attachments).toHaveLength(1);
      expect(item.displayExamCode).toBeTruthy();
    });
  });

  describe("mapAdminReviewQuestion", () => {
    it("maps single-choice question with correct option", () => {
      const question = mapAdminReviewQuestion(
        {
          id: "q-1",
          orderIndex: 1,
          content: "Câu hỏi 1",
          questionType: "SingleChoice",
          options: [
            { id: "opt-a", label: "A", text: "Đáp án A" },
            { id: "opt-b", label: "B", text: "Đáp án B" },
          ],
          correctOptionIds: ["opt-a"],
        },
        0,
      );
      expect(question.correctIndices).toContain(0);
      expect(question.isMulti).toBe(false);
    });

    it("maps multi-select question", () => {
      const question = mapAdminReviewQuestion({
        id: "q-2",
        questionType: "MultiSelect",
        options: [
          { id: "a", label: "A", text: "A" },
          { id: "b", label: "B", text: "B" },
        ],
        correctOptionIds: ["a", "b"],
      });
      expect(question.isMulti).toBe(true);
      expect(question.correctIndices).toEqual([0, 1]);
    });
  });

  describe("mapPaymentAuditLogItem", () => {
    it("parses username from payload JSON", () => {
      const item = mapPaymentAuditLogItem(mockPaymentAuditLogDto);
      expect(item.action).toBe("payment_verified");
      expect(item.username).toBe("demo_student");
      expect(item.type).toBe("payment");
    });

    it("handles invalid payload JSON gracefully", () => {
      const item = mapPaymentAuditLogItem({
        ...mockPaymentAuditLogDto,
        payloadJson: "{bad",
      });
      expect(item.username).toBe("—");
    });
  });

  describe("mapAdminPaymentListItem", () => {
    it("maps paid payment with activation timestamp", () => {
      const item = mapAdminPaymentListItem(mockAdminPaymentDto);
      expect(item.username).toBe("demo_student");
      expect(item.amount).toBe(384000);
      expect(item.activatedAt).not.toBe("—");
    });

    it("maps refund requested status with note", () => {
      const item = mapAdminPaymentListItem({
        ...mockAdminPaymentDto,
        status: "RefundRequested",
        refundRequestReason: "Không dùng nữa",
        refundRequestedAt: "2026-07-10T10:00:00Z",
      });
      expect(item.status).toBe("refund_requested");
      expect(item.note).toContain("Không dùng nữa");
    });
  });

  describe("mapAdminReportListItem", () => {
    it("maps pending community report", () => {
      const item = mapAdminReportListItem(mockAdminReportDto);
      expect(item.status).toBe("pending");
      expect(item.reporter).toBe("reporter_user");
      expect(item.reportedUserTrustScore).toBe(45);
      expect(item.post.title).toBe("Bài viết bị báo cáo");
    });

    it("includes resolution block for resolved reports", () => {
      const item = mapAdminReportListItem({
        ...mockAdminReportDto,
        status: "Resolved",
        resolvedAt: "2026-07-10T12:00:00Z",
        resolvedBy: { username: "mod" },
      });
      expect(item.status).toBe("resolved");
      expect(item.resolution?.resolvedBy).toBe("mod");
    });
  });

  describe("mapAdminBannedUser", () => {
    it("maps temporary ban with duration days", () => {
      const item = mapAdminBannedUser(mockBannedUserDto);
      expect(item.type).toBe("temporary");
      expect(item.username).toBe("banned_user");
      expect(item.days).toBeGreaterThan(0);
    });

    it("maps permanent ban type", () => {
      const item = mapAdminBannedUser({
        ...mockBannedUserDto,
        banType: "Permanent",
        until: null,
      });
      expect(item.type).toBe("permanent");
      expect(item.days).toBeUndefined();
    });
  });

  describe("mapViolatingUser and mapViolatingUserDetail", () => {
    it("maps violating user list item", () => {
      const item = mapViolatingUser(mockViolatingUserDto);
      expect(item.username).toBe("bad_actor");
      expect(item.rank).toBe("gold");
      expect(item.violations).toBe(3);
      expect(item.studentId).toContain("SE");
    });

    it("maps detail with violation history", () => {
      const detail = mapViolatingUserDetail(mockViolatingUserDetailDto);
      expect(detail.tempBanCount).toBe(1);
      expect(detail.history).toHaveLength(1);
      expect(detail.history[0].actionLabel).toBe("Cảnh báo");
    });
  });

  describe("mapLevelConfigToRankTier", () => {
    it("maps level config with voucher discount", () => {
      const tier = mapLevelConfigToRankTier(
        { id: "lvl-gold", name: "Gold", minPoints: 1000, voucherPercent: 10 },
        1,
      );
      expect(tier.name).toBe("Gold");
      expect(tier.sortOrder).toBe(2);
      expect(tier.voucherDiscount).toBe(10);
      expect(tier.colorKey).toBe("gold");
    });
  });

  describe("badge mappers", () => {
    it("maps badge admin DTO from condition JSON", () => {
      const badge = mapBadgeAdminDto(mockBadgeAdminDto);
      expect(badge.slug).toBe("first-post");
      expect(badge.pointsReward).toBe(10);
      expect(badge.unlockCount).toBe(42);
    });

    it("round-trips badge create and update requests", () => {
      const form = {
        slug: "streak-7",
        name: "Streak 7 ngày",
        description: "Duy trì streak",
        category: "gamification",
        triggerType: "streak_milestone",
        triggerValue: 7,
        pointsReward: 50,
        icon: "🔥",
        active: true,
      };
      const createReq = mapBadgeToCreateRequest(form);
      expect(createReq.code).toBe("streak-7");
      expect(JSON.parse(createReq.conditionJson).triggerValue).toBe(7);

      const updateReq = mapBadgeToUpdateRequest({ ...form, slug: "streak-7" });
      expect(updateReq.name).toBe("Streak 7 ngày");
    });
  });

  describe("point rule mappers", () => {
    it("maps point rule DTO with FE event type", () => {
      const rule = mapPointRuleAdminDto(mockPointRuleDto);
      expect(rule.eventType).toBe("daily_login");
      expect(rule.points).toBe(5);
      expect(rule.intervalDays).toBe(null);
    });

    it("maps streak milestone with interval days", () => {
      const rule = mapPointRuleAdminDto({
        ...mockPointRuleDto,
        eventType: "streak.milestone_7",
      });
      expect(rule.eventType).toBe("streak_milestone");
      expect(rule.intervalDays).toBe(7);
    });

    it("creates and updates point rule payloads", () => {
      const data = {
        slug: "post-published",
        name: "Đăng bài",
        eventType: "post_published",
        points: 20,
        active: true,
        description: "Đăng bài cộng đồng",
      };
      expect(mapPointRuleToCreateRequest(data).eventType).toBe("post.published");
      expect(mapPointRuleToUpdateRequest(data).points).toBe(20);
    });
  });

  describe("mapDashboardCharts", () => {
    it("normalizes chart series with numeric values", () => {
      const charts = mapDashboardCharts(mockDashboardChartsDto);
      expect(charts.userGrowth.data).toHaveLength(2);
      expect(charts.userGrowth.summary.total).toBe(25);
      expect(charts.traffic.peak).toBe(120);
      expect(charts.revenue.valueSuffix).toBe(" tr");
    });
  });

  describe("audit and activity items", () => {
    it("maps admin audit log item", () => {
      const item = mapAdminAuditLogItem({
        id: "log-1",
        createdAt: "2026-07-10T10:00:00Z",
        text: "Admin cộng Premium",
        type: "subscription",
      });
      expect(item.text).toContain("Premium");
      expect(item.time).not.toBe("—");
    });

    it("maps user activity item", () => {
      const item = mapAdminUserActivityItem({
        id: "act-1",
        createdAt: "2026-07-10T09:00:00Z",
        action: "login",
      });
      expect(item.text).toBe("login");
    });
  });
});
