import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { createMockAuth, createMockToast, renderHookWithRouter } from "../helpers/testProviders";

const mockUseAuth = vi.fn();
const mockUseToast = vi.fn();

vi.mock("@/context", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/common/Toast/ToastProvider", () => ({
  useToast: () => mockUseToast(),
}));

describe("useRequireAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseToast.mockReturnValue(createMockToast());
  });

  it("returns true for authenticated users on regular routes", () => {
    mockUseAuth.mockReturnValue(createMockAuth({ isAuthenticated: true }));

    const { result } = renderHookWithRouter(() => useRequireAuth(), {
      initialEntries: ["/home/messages"],
    });

    expect(result.current.requireAuth()).toBe(true);
    expect(mockUseToast().showCountdownToast).not.toHaveBeenCalled();
  });

  it("shows countdown toast for guests on protected routes", () => {
    const toast = createMockToast();
    mockUseToast.mockReturnValue(toast);
    mockUseAuth.mockReturnValue(createMockAuth({ isAuthenticated: false }));

    const { result } = renderHookWithRouter(() => useRequireAuth(), {
      initialEntries: ["/home/messages"],
    });

    expect(result.current.requireAuth("Cần đăng nhập")).toBe(false);
    expect(toast.showCountdownToast).toHaveBeenCalledWith(
      "Cần đăng nhập",
      expect.any(Function),
      expect.any(Function),
    );
  });

  it("blocks repeat prompts while countdown is pending", () => {
    const toast = createMockToast();
    mockUseToast.mockReturnValue(toast);
    mockUseAuth.mockReturnValue(createMockAuth({ isAuthenticated: false }));

    const { result } = renderHookWithRouter(() => useRequireAuth(), {
      initialEntries: ["/home/messages"],
    });

    expect(result.current.requireAuth()).toBe(false);
    expect(result.current.requireAuth()).toBe(false);
    expect(toast.showCountdownToast).toHaveBeenCalledTimes(1);
  });

  it("prompts guests on subject content paths when requireAuth is called", () => {
    const toast = createMockToast();
    mockUseToast.mockReturnValue(toast);
    mockUseAuth.mockReturnValue(createMockAuth({ isAuthenticated: false }));

    const { result } = renderHookWithRouter(() => useRequireAuth(), {
      initialEntries: ["/community/final-exam/PRF192"],
    });

    expect(result.current.needsLoginPrompt).toBe(true);
    expect(result.current.requireAuth()).toBe(false);
    expect(toast.showCountdownToast).toHaveBeenCalled();
  });

  it("supports guestOnly option to force auth check on any route", () => {
    const toast = createMockToast();
    mockUseToast.mockReturnValue(toast);
    mockUseAuth.mockReturnValue(createMockAuth({ isAuthenticated: false }));

    const { result } = renderHookWithRouter(() => useRequireAuth(), {
      initialEntries: ["/"],
    });

    expect(result.current.requireAuth("Login required", { guestOnly: true })).toBe(false);
    expect(toast.showCountdownToast).toHaveBeenCalled();
  });
});
