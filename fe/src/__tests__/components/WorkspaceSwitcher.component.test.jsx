import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import WorkspaceSwitcher from "@/common/WorkspaceSwitcher/WorkspaceSwitcher";
import { mockAdmin, mockFreeStudent, mockModerator } from "../fixtures/mockUsers";

const mockUseAuth = vi.fn();

vi.mock("@/context", () => ({
  useAuth: () => mockUseAuth(),
}));

function renderSwitcher(ui, { route = "/admin" } = {}) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}

describe("WorkspaceSwitcher", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders null for student with only one accessible workspace", () => {
    mockUseAuth.mockReturnValue({ user: mockFreeStudent });
    const { container } = renderSwitcher(<WorkspaceSwitcher />);
    expect(container.firstChild).toBeNull();
  });

  it("renders admin, moderator, and student links for admin user", () => {
    mockUseAuth.mockReturnValue({ user: mockAdmin });
    renderSwitcher(<WorkspaceSwitcher />, { route: "/admin" });

    expect(screen.getByRole("link", { name: /Quản trị Admin/i }).getAttribute("href")).toBe(
      "/admin",
    );
    expect(screen.getByRole("link", { name: /Kiểm duyệt/i }).getAttribute("href")).toBe(
      "/moderator/reports",
    );
    expect(screen.getByRole("link", { name: /Trang sinh viên/i }).getAttribute("href")).toBe(
      "/home",
    );
  });

  it("hides admin workspace from moderator", () => {
    mockUseAuth.mockReturnValue({ user: mockModerator });
    renderSwitcher(<WorkspaceSwitcher />, { route: "/moderator/reports" });

    expect(screen.queryByRole("link", { name: /Quản trị Admin/i })).toBeNull();
    expect(screen.getByRole("link", { name: /Kiểm duyệt/i })).toBeTruthy();
  });

  it("marks current workspace with aria-current", () => {
    mockUseAuth.mockReturnValue({ user: mockAdmin });
    renderSwitcher(<WorkspaceSwitcher />, { route: "/moderator/reports" });

    expect(screen.getByRole("link", { name: /Kiểm duyệt/i }).getAttribute("aria-current")).toBe(
      "page",
    );
  });

  it("hides current workspace when showCurrent is false", () => {
    mockUseAuth.mockReturnValue({ user: mockAdmin });
    renderSwitcher(<WorkspaceSwitcher showCurrent={false} />, { route: "/admin" });

    expect(screen.queryByRole("link", { name: /Quản trị Admin/i })).toBeNull();
    expect(screen.getByRole("link", { name: /Kiểm duyệt/i })).toBeTruthy();
  });

  it("calls onNavigate when a workspace link is clicked", () => {
    mockUseAuth.mockReturnValue({ user: mockAdmin });
    const onNavigate = vi.fn();
    renderSwitcher(<WorkspaceSwitcher onNavigate={onNavigate} />, { route: "/admin" });

    screen.getByRole("link", { name: /Trang sinh viên/i }).click();
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
