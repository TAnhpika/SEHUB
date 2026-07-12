import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import GuestHeader from "@/common/Header/GuestHeader/GuestHeader";

const mockUseAuth = vi.fn();

vi.mock("@/context", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/common/context/MainShellContext", () => ({
  useMainShellOptional: () => null,
}));

vi.mock("@/common/Header/HeaderUserActions/HeaderUserActions", () => ({
  default: () => <div data-testid="header-user-actions">User</div>,
}));

vi.mock("@/common/ThemeSwitcher/ThemeSwitcher", () => ({
  default: () => <div data-testid="theme-switcher">Theme</div>,
}));

function renderGuestHeader(route = "/") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <GuestHeader />
    </MemoryRouter>,
  );
}

describe("GuestHeader", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isBootstrapping: false,
      user: null,
    });
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  describe("guest (unauthenticated)", () => {
    it("renders brand, nav links, and auth CTAs", () => {
      renderGuestHeader("/");

      expect(screen.getByText("SEHub")).toBeTruthy();
      expect(screen.getAllByRole("link", { name: "Trang chủ" }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole("link", { name: "Cộng đồng" }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole("link", { name: "Hỗ trợ" }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole("link", { name: "Đăng nhập" }).length).toBeGreaterThan(0);
      expect(screen.getByRole("link", { name: "Đăng ký" })).toBeTruthy();
    });

    it("opens mobile drawer when menu button is clicked", () => {
      renderGuestHeader("/");

      const menuBtn = screen.getByRole("button", { name: /Mở menu điều hướng/i });
      fireEvent.click(menuBtn);

      expect(screen.getByRole("button", { name: /Đóng menu điều hướng/i })).toBeTruthy();
      expect(document.querySelector(".shell-drawer-overlay")).toBeTruthy();
    });

    it("closes drawer on Escape key", () => {
      const { unmount } = renderGuestHeader("/");
      fireEvent.click(screen.getByRole("button", { name: /Mở menu điều hướng/i }));

      fireEvent.keyDown(document, { key: "Escape" });

      expect(screen.getByRole("button", { name: /Mở menu điều hướng/i })).toBeTruthy();
      unmount();
      expect(document.querySelector(".shell-drawer-overlay")).toBeNull();
    });

    it("highlights active nav link for current route", () => {
      renderGuestHeader("/community");
      const communityLinks = screen.getAllByRole("link", { name: "Cộng đồng" });
      expect(communityLinks.some((link) => link.className.includes("nav-active") || link.className.includes("drawer-link-active"))).toBe(true);
    });
  });

  describe("authenticated student", () => {
    it("shows HeaderUserActions instead of login/register", () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isBootstrapping: false,
        user: { role: "student", username: "demo_student" },
      });

      renderGuestHeader("/home");
      expect(screen.getAllByTestId("header-user-actions").length).toBeGreaterThan(0);
      expect(screen.queryByRole("link", { name: "Đăng ký" })).toBeNull();
    });

    it("points home link to /home for students", () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isBootstrapping: false,
        user: { role: "student", username: "demo_student" },
      });

      renderGuestHeader("/home");
      const homeLinks = screen.getAllByRole("link", { name: "Trang chủ" });
      expect(homeLinks[0].getAttribute("href")).toBe("/home");
    });
  });

  describe("authenticated staff", () => {
    it("points home link to admin workspace for admin", () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isBootstrapping: false,
        user: { role: "admin", username: "admin" },
      });

      renderGuestHeader("/admin");
      const homeLinks = screen.getAllByRole("link", { name: "Trang chủ" });
      expect(homeLinks[0].getAttribute("href")).toBe("/admin");
    });
  });
});
