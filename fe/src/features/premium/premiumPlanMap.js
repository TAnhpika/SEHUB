/** Maps FE pricing route ids to backend SubscriptionPlan.Code */
export const FE_PLAN_TO_BE_CODE = {
  trial: "1m",
  semester: "8m",
  full: "4y",
};

export const BE_CODE_TO_FE_PLAN = Object.fromEntries(
  Object.entries(FE_PLAN_TO_BE_CODE).map(([feId, beCode]) => [beCode, feId]),
);

export function getBePlanCode(fePlanId) {
  return FE_PLAN_TO_BE_CODE[fePlanId] ?? null;
}

export function getFePlanId(bePlanCode) {
  return BE_CODE_TO_FE_PLAN[bePlanCode] ?? null;
}

export function isValidFePlanId(planId) {
  return Boolean(planId && FE_PLAN_TO_BE_CODE[planId]);
}
