import { STUDENT_PLAN } from "@/utils/studentPlan";

/** @typedef {import('@/context').AuthUser} AuthUserShape */

export const mockGuestUser = null;

export const mockFreeStudent = {
  id: "11111111-1111-1111-1111-111111111101",
  username: "free_student",
  email: "free.student@sehub.local",
  displayName: "Free Student",
  role: "student",
  plan: STUDENT_PLAN.FREE,
  isPremium: false,
  aiTokens: { limit: 10, used: 0, remaining: 10 },
};

export const mockPremiumStudent = {
  id: "22222222-2222-2222-2222-222222222202",
  username: "demo_student",
  email: "demo.student@sehub.local",
  displayName: "Demo Premium",
  role: "student",
  plan: STUDENT_PLAN.PREMIUM,
  isPremium: true,
  aiTokens: { limit: 1000, used: 120, remaining: 880 },
};

export const mockExhaustedFreeStudent = {
  ...mockFreeStudent,
  id: "33333333-3333-3333-3333-333333333303",
  username: "exhausted_free",
  aiTokens: { limit: 10, used: 10, remaining: 0 },
};

export const mockModerator = {
  id: "44444444-4444-4444-4444-444444444404",
  username: "demo_moderator",
  email: "moderator@sehub.local",
  displayName: "Demo Moderator",
  role: "moderator",
  plan: STUDENT_PLAN.FREE,
  isPremium: true,
};

export const mockAdmin = {
  id: "55555555-5555-5555-5555-555555555505",
  username: "admin",
  email: "admin@sehub.local",
  displayName: "System Admin",
  role: "admin",
  plan: STUDENT_PLAN.PREMIUM,
  isPremium: true,
};

export const mockMalformedUser = {
  id: "",
  username: "",
  email: "",
  role: undefined,
  plan: "UnknownPlan",
};

export const mockUnknownRoleUser = {
  id: "66666666-6666-6666-6666-666666666606",
  username: "partner_bot",
  email: "partner@external.vn",
  role: "partner",
  plan: STUDENT_PLAN.PREMIUM,
};

export const allMockUsers = [
  mockGuestUser,
  mockFreeStudent,
  mockPremiumStudent,
  mockExhaustedFreeStudent,
  mockModerator,
  mockAdmin,
  mockMalformedUser,
  mockUnknownRoleUser,
];
