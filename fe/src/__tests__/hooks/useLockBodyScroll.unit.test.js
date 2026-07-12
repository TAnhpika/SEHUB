import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

describe("useLockBodyScroll", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("does not attach listeners when inactive", () => {
    const { unmount } = renderHook(() => useLockBodyScroll(false));
    const event = new WheelEvent("wheel", { bubbles: true, cancelable: true });
    expect(document.dispatchEvent(event)).toBe(true);
    unmount();
  });

  it("blocks and restores background scroll across mount lifecycle", () => {
    const { unmount } = renderHook(() => useLockBodyScroll(true));

    const blocked = new WheelEvent("wheel", { bubbles: true, cancelable: true });
    expect(!document.dispatchEvent(blocked)).toBe(true);

    act(() => {
      unmount();
    });

    const allowed = new WheelEvent("wheel", { bubbles: true, cancelable: true });
    expect(document.dispatchEvent(allowed)).toBe(true);
  });

  it("allows wheel events inside scrollable targets while locked", () => {
    const scrollable = document.createElement("div");
    scrollable.setAttribute("data-scroll-lock-scrollable", "");
    document.body.appendChild(scrollable);

    const { unmount } = renderHook(() => useLockBodyScroll(true));

    const event = new WheelEvent("wheel", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "target", { value: scrollable });
    expect(scrollable.dispatchEvent(event)).toBe(true);

    unmount();
  });

  it("prevents arrow key scrolling on background when active", () => {
    const { unmount } = renderHook(() => useLockBodyScroll(true));

    const event = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });
    expect(!document.dispatchEvent(event)).toBe(true);

    unmount();
  });
});
