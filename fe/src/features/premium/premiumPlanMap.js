/**
 * @fileoverview Ánh xạ ID gói Premium phía FE ↔ mã `SubscriptionPlan.Code` phía backend.
 *
 * @module features/premium/premiumPlanMap
 */

/**
 * Map route ID frontend → mã gói backend.
 *
 * @constant {Readonly<Record<string, string>>}
 * @readonly
 *
 * @example
 * FE_PLAN_TO_BE_CODE.trial // => '1m'
 */
export const FE_PLAN_TO_BE_CODE = {
  trial: "1m",
  semester: "8m",
  full: "4y",
};

/**
 * Map ngược mã backend → route ID frontend.
 *
 * @constant {Readonly<Record<string, string>>}
 * @readonly
 */
export const BE_CODE_TO_FE_PLAN = Object.fromEntries(
  Object.entries(FE_PLAN_TO_BE_CODE).map(([feId, beCode]) => [beCode, feId]),
);

/**
 * Chuyển ID gói FE sang mã backend.
 *
 * @param {string} fePlanId - ID route (ví dụ `trial`, `semester`, `full`).
 * @returns {string|null} Mã backend (`1m`, `8m`, `4y`), hoặc `null` nếu không khớp.
 *
 * @example
 * getBePlanCode('semester'); // => '8m'
 */
export function getBePlanCode(fePlanId) {
  return FE_PLAN_TO_BE_CODE[fePlanId] ?? null;
}

/**
 * Chuyển mã backend sang ID gói FE.
 *
 * @param {string} bePlanCode - Mã gói backend.
 * @returns {string|null} ID route FE, hoặc `null` nếu không khớp.
 *
 * @example
 * getFePlanId('4y'); // => 'full'
 */
export function getFePlanId(bePlanCode) {
  return BE_CODE_TO_FE_PLAN[bePlanCode] ?? null;
}

/**
 * Kiểm tra `planId` có phải ID gói Premium hợp lệ trên FE hay không.
 *
 * @param {string} planId - ID cần kiểm tra.
 * @returns {boolean} `true` nếu tồn tại trong `FE_PLAN_TO_BE_CODE`.
 */
export function isValidFePlanId(planId) {
  return Boolean(planId && FE_PLAN_TO_BE_CODE[planId]);
}
