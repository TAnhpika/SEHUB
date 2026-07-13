import { describe, expect, it } from "vitest";
import {
  FE_ID_BY_PLAN_CODE,
  PLAN_CODE_BY_FE_ID,
  mapApiPlanToFePlan,
  mapApiPlansToFePlans,
  mapPaymentOrderDto,
  mapRankVoucherPreviewDto,
  mapSubscriptionStatusDto,
  resolveFePlanIdFromCode,
  resolvePlanCodeFromFeId,
} from "@/api/premiumMapper";
import {
  mockApiPremiumPlanDto,
  mockPaymentOrderDto,
  mockPremiumPlanTemplates,
} from "../fixtures/mockApiDtos";

describe("premiumMapper", () => {
  describe("plan code resolution", () => {
    it("maps FE plan ids to backend codes and back", () => {
      expect(PLAN_CODE_BY_FE_ID.trial).toBe("1m");
      expect(PLAN_CODE_BY_FE_ID.semester).toBe("8m");
      expect(PLAN_CODE_BY_FE_ID.full).toBe("4y");
      expect(resolvePlanCodeFromFeId("trial")).toBe("1m");
      expect(resolveFePlanIdFromCode("8m")).toBe("semester");
      expect(FE_ID_BY_PLAN_CODE["4y"]).toBe("full");
    });

    it("returns original value when no mapping exists", () => {
      expect(resolvePlanCodeFromFeId("custom")).toBe("custom");
      expect(resolveFePlanIdFromCode("99m")).toBe("99m");
    });
  });

  describe("mapApiPlanToFePlan", () => {
    it("combines API pricing with FE template checkout metadata", () => {
      const plan = mapApiPlanToFePlan(mockApiPremiumPlanDto, mockPremiumPlanTemplates);
      expect(plan.id).toBe("semester");
      expect(plan.planCode).toBe("8m");
      expect(plan.price).toMatch(/đ\/tháng/);
      expect(plan.checkout.totalPrice).toBe(384000);
      expect(plan.checkout.months).toBe(8);
      expect(plan.checkout.packageTitle).toBe("Premium học kỳ");
    });

    it("falls back to second template when plan id is unknown", () => {
      const plan = mapApiPlanToFePlan(
        { code: "unknown", durationDays: 30, priceVnd: 48000 },
        mockPremiumPlanTemplates,
      );
      expect(plan.id).toBe("unknown");
      expect(plan.name).toBe(mockPremiumPlanTemplates[1].name);
    });
  });

  describe("mapApiPlansToFePlans", () => {
    it("maps array of API plans", () => {
      const plans = mapApiPlansToFePlans(
        [mockApiPremiumPlanDto, { code: "1m", durationDays: 30, priceVnd: 48000 }],
        mockPremiumPlanTemplates,
      );
      expect(plans).toHaveLength(2);
      expect(plans[0].planCode).toBe("8m");
      expect(plans[1].id).toBe("trial");
    });

    it("handles null or empty apiPlans", () => {
      expect(mapApiPlansToFePlans(null, mockPremiumPlanTemplates)).toEqual([]);
    });
  });

  describe("mapPaymentOrderDto", () => {
    it("normalizes payment order fields for checkout UI", () => {
      const order = mapPaymentOrderDto(mockPaymentOrderDto);
      expect(order).toMatchObject({
        orderId: "order-001",
        payOsOrderCode: 12345678,
        amount: 345600,
        originalAmount: 384000,
        discountPercent: 10,
        discountSource: "rank",
        status: "Pending",
        planCode: "8m",
      });
      expect(order.qrUrl).toContain("payos");
    });

    it("defaults amounts when optional fields are missing", () => {
      const order = mapPaymentOrderDto({ amount: 100000, status: "Paid" });
      expect(order.originalAmount).toBe(100000);
      expect(order.discountPercent).toBe(null);
    });
  });

  describe("mapRankVoucherPreviewDto", () => {
    it("maps rank voucher preview for checkout", () => {
      const preview = mapRankVoucherPreviewDto({
        levelName: "Gold",
        points: 1500,
        discountPercent: 10,
        eligible: true,
        message: "Giảm 10% theo hạng Gold",
      });
      expect(preview.eligible).toBe(true);
      expect(preview.discountPercent).toBe(10);
    });
  });

  describe("mapSubscriptionStatusDto", () => {
    it("maps active subscription status", () => {
      const status = mapSubscriptionStatusDto({
        isActive: true,
        expiresAt: "2027-01-01T00:00:00Z",
        planName: "Premium học kỳ",
        canRequestRefund: true,
        hasPendingRefundRequest: false,
      });
      expect(status.isActive).toBe(true);
      expect(status.canRequestRefund).toBe(true);
      expect(status.hasPendingRefundRequest).toBe(false);
    });
  });
});
