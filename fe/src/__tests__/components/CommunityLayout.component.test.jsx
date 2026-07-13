import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CommunityLayout from "@/common/Layout/CommunityLayout/CommunityLayout";

vi.mock("@/common/Header/GuestHeader/GuestHeader", () => ({
  default: () => <div data-testid="guest-header">GuestHeader</div>,
}));

vi.mock("@/common/Sidebar/FeedSidebar/FeedSidebar", () => ({
  default: () => <div data-testid="feed-sidebar">FeedSidebar</div>,
}));

vi.mock("@/common/Sidebar/CommunitySidebar/CommunitySidebar", () => ({
  default: () => <div data-testid="community-sidebar">CommunitySidebar</div>,
}));

vi.mock("@/common/Footer/Footer", () => ({
  default: () => <div data-testid="footer">Footer</div>,
}));

function renderCommunityLayout(initialPath) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/community" element={<CommunityLayout />}>
          <Route index element={<div data-testid="outlet-feed">Feed home</div>} />
          <Route path="post/:id" element={<div data-testid="outlet-post">Post detail</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("CommunityLayout", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("renders shell with guest header, feed sidebar, footer, and outlet on feed home", () => {
    renderCommunityLayout("/community");

    expect(screen.getByTestId("guest-header")).toBeTruthy();
    expect(screen.getByTestId("feed-sidebar")).toBeTruthy();
    expect(screen.getByTestId("community-sidebar")).toBeTruthy();
    expect(screen.getByTestId("footer")).toBeTruthy();
    expect(screen.getByTestId("outlet-feed")).toBeTruthy();
    expect(document.getElementById("feed-top")).toBeTruthy();
  });

  it("hides community sidebar on nested community routes", () => {
    renderCommunityLayout("/community/post/abc");

    expect(screen.getByTestId("feed-sidebar")).toBeTruthy();
    expect(screen.queryByTestId("community-sidebar")).toBeNull();
    expect(screen.getByTestId("outlet-post")).toBeTruthy();
  });

  it("applies feed-specific layout class only on community home", () => {
    const { container, unmount } = renderCommunityLayout("/community");
    const feedWorkspace = container.querySelector('[class*="workspace-feed"]');
    expect(feedWorkspace).toBeTruthy();
    unmount();

    const { container: nestedContainer } = renderCommunityLayout("/community/post/1");
    expect(nestedContainer.querySelector('[class*="workspace-feed"]')).toBeNull();
  });
});
