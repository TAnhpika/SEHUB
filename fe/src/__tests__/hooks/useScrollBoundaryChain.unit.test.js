import { createRef } from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useScrollBoundaryChain } from "@/hooks/useScrollBoundaryChain";

describe("useScrollBoundaryChain", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  function mountScrollable() {
    const outer = document.createElement("div");
    document.body.appendChild(outer);

    const inner = document.createElement("div");
    inner.style.height = "100px";
    outer.appendChild(inner);

    let innerScrollTop = 200;
    let outerScrollTop = 50;

    Object.defineProperty(inner, "clientHeight", { value: 100, configurable: true });
    Object.defineProperty(inner, "scrollHeight", { value: 300, configurable: true });
    Object.defineProperty(outer, "clientHeight", { value: 400, configurable: true });
    Object.defineProperty(outer, "scrollHeight", { value: 800, configurable: true });
    Object.defineProperty(inner, "scrollTop", {
      get: () => innerScrollTop,
      set: (value) => {
        innerScrollTop = value;
      },
      configurable: true,
    });
    Object.defineProperty(outer, "scrollTop", {
      get: () => outerScrollTop,
      set: (value) => {
        outerScrollTop = value;
      },
      configurable: true,
    });

    vi.spyOn(window, "getComputedStyle").mockImplementation((element) => {
      if (element === inner || element === outer) {
        return { overflowY: "auto" };
      }
      return { overflowY: "visible" };
    });

    return { outer, inner, getOuterScrollTop: () => outerScrollTop };
  }

  it("does nothing when ref is not attached", () => {
    const ref = createRef();
    const { unmount } = renderHook(() => useScrollBoundaryChain(ref));
    unmount();
    expect(true).toBe(true);
  });

  it("chains wheel delta to parent when inner scroll hits bottom", () => {
    const { inner, getOuterScrollTop } = mountScrollable();
    const ref = createRef();
    ref.current = inner;

    renderHook(() => useScrollBoundaryChain(ref));

    act(() => {
      const event = new WheelEvent("wheel", { deltaY: 50, bubbles: false, cancelable: true });
      inner.dispatchEvent(event);
    });

    expect(getOuterScrollTop()).toBe(100);
  });

  it("chains wheel delta to parent when inner scroll is at top", () => {
    const { inner, getOuterScrollTop } = mountScrollable();
    Object.defineProperty(inner, "scrollTop", {
      get: () => 0,
      set: () => {},
      configurable: true,
    });

    const ref = createRef();
    ref.current = inner;
    renderHook(() => useScrollBoundaryChain(ref));

    act(() => {
      inner.dispatchEvent(
        new WheelEvent("wheel", { deltaY: -40, bubbles: false, cancelable: true }),
      );
    });

    expect(getOuterScrollTop()).toBe(10);
  });

  it("does not chain when inner content is not scrollable", () => {
    const { inner, getOuterScrollTop } = mountScrollable();
    Object.defineProperty(inner, "scrollHeight", { value: 100, configurable: true });

    const ref = createRef();
    ref.current = inner;
    renderHook(() => useScrollBoundaryChain(ref));

    act(() => {
      inner.dispatchEvent(
        new WheelEvent("wheel", { deltaY: 50, bubbles: false, cancelable: true }),
      );
    });

    expect(getOuterScrollTop()).toBe(50);
  });
});
