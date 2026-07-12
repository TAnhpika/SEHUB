import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import MainHeader from "@/common/Header/MainHeader/MainHeader";

const mockNavigate = vi.fn();
const mockMainShell = {
  sidebarOpen: false,
  setSidebarOpen: vi.fn(),
  closeSidebar: vi.fn(),
};

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/common/context/MainShellContext", () => ({
  useMainShellOptional: vi.fn(),
}));

vi.mock("@/common/Header/HeaderUserActions/HeaderUserActions", () => ({
  default: () => <div data-testid="header-user-actions">User</div>,
}));

import { useMainShellOptional } from "@/common/context/MainShellContext";

function renderMainHeader(route = "/home", search = "") {
  const path = search ? `${route}?${search}` : route;
  return render(
    <MemoryRouter initialEntries={[path]}>
      <MainHeader />
    </MemoryRouter>,
  );
}

describe("MainHeader", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    mockNavigate.mockReset();
    mockMainShell.sidebarOpen = false;
    mockMainShell.setSidebarOpen.mockReset();
    mockMainShell.closeSidebar.mockReset();
    useMainShellOptional.mockReturnValue(null);
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("renders brand, search form, and user actions", () => {
    renderMainHeader();

    expect(screen.getByText("SEHub")).toBeTruthy();
    expect(screen.getByRole("searchbox", { name: "Tìm kiếm" })).toBeTruthy();
    expect(screen.getByTestId("header-user-actions")).toBeTruthy();
    expect(screen.getByRole("link", { name: "SEHub" }).getAttribute("href")).toBe("/home");
  });

  it("navigates to search page with encoded query on submit", () => {
    renderMainHeader("/home");

    const input = screen.getByRole("searchbox", { name: "Tìm kiếm" });
    fireEvent.change(input, { target: { value: "  PRF192 đề thi  " } });
    fireEvent.submit(input.closest("form"));

    expect(mockNavigate).toHaveBeenCalledWith("/home/search?q=PRF192%20%C4%91%E1%BB%81%20thi");
    expect(input.value).toBe("");
  });

  it("does not navigate when search query is empty", () => {
    renderMainHeader("/home");

    const input = screen.getByRole("searchbox", { name: "Tìm kiếm" });
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.submit(input.closest("form"));

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("syncs search input from URL on search page", () => {
    renderMainHeader("/home/search", "q=hello+world");

    expect(screen.getByRole("searchbox", { name: "Tìm kiếm" }).value).toBe("hello world");
  });

  it("navigates to search page when mobile search button is clicked", () => {
    renderMainHeader("/home");

    fireEvent.click(screen.getByRole("button", { name: "Tìm kiếm" }));

    expect(mockNavigate).toHaveBeenCalledWith("/home/search");
  });

  it("opens sidebar when menu button is clicked and shell context exists", () => {
    useMainShellOptional.mockReturnValue(mockMainShell);
    renderMainHeader();

    fireEvent.click(screen.getByRole("button", { name: "Mở menu điều hướng" }));

    expect(mockMainShell.setSidebarOpen).toHaveBeenCalledWith(true);
  });

  it("closes sidebar when menu button is clicked while drawer is open", () => {
    mockMainShell.sidebarOpen = true;
    useMainShellOptional.mockReturnValue(mockMainShell);
    renderMainHeader();

    fireEvent.click(screen.getByRole("button", { name: "Đóng menu điều hướng" }));

    expect(mockMainShell.closeSidebar).toHaveBeenCalled();
    expect(mockMainShell.setSidebarOpen).not.toHaveBeenCalled();
  });

  it("hides menu button when main shell context is unavailable", () => {
    useMainShellOptional.mockReturnValue(null);
    renderMainHeader();

    expect(screen.queryByRole("button", { name: /menu điều hướng/i })).toBeNull();
  });
});
