import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRequirePremium } from "@/hooks/useRequirePremium";
import { createMockAuth, createMockToast } from "../helpers/testProviders";

const mockNavigate = vi.fn();
const mockUseAuth = vi.fn();
const mockUseToast = vi.fn();

vi.mock("@/context", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/common/Toast/ToastProvider", () => ({
  useToast: () => mockUseToast(),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("useRequirePremium", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseToast.mockReturnValue(createMockToast());
  });

  it("returns true immediately for premium authenticated users", () => {
    mockUseAuth.mockReturnValue(createMockAuth({ isAuthenticated: true, isPremium: true }));

    const { result } = renderHook(() => useRequirePremium());
    expect(result.current.requirePremium()).toBe(true);
    expect(mockUseToast().showToast).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows login toast and returns false for guests", () => {
    const toast = createMockToast();
    mockUseToast.mockReturnValue(toast);
    mockUseAuth.mockReturnValue(createMockAuth({ isAuthenticated: false, isPremium: false }));

    const { result } = renderHook(() => useRequirePremium());
    expect(result.current.requirePremium()).toBe(false);
    expect(toast.showToast).toHaveBeenCalledWith(
      expect.stringContaining("Đăng nhập"),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows custom message and navigates to premium for free students", () => {
    const toast = createMockToast();
    mockUseToast.mockReturnValue(toast);
    mockUseAuth.mockReturnValue(createMockAuth({ isAuthenticated: true, isPremium: false }));

    const { result } = renderHook(() => useRequirePremium());
    const allowed = result.current.requirePremium("Nâng cấp để dùng AI.");

    expect(allowed).toBe(false);
    expect(toast.showToast).toHaveBeenCalledWith("Nâng cấp để dùng AI.");
    expect(mockNavigate).toHaveBeenCalledWith("/home/premium");
  });

  it("exposes isAuthenticated and isPremium flags", () => {
    mockUseAuth.mockReturnValue(createMockAuth({ isAuthenticated: true, isPremium: false }));

    const { result } = renderHook(() => useRequirePremium());
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isPremium).toBe(false);
  });
});
