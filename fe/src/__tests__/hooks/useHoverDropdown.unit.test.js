import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useHoverDropdown } from "@/hooks/useHoverDropdown";

describe("useHoverDropdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens on show and closes on hide", () => {
    const { result } = renderHook(() => useHoverDropdown());

    act(() => {
      result.current.show();
    });
    expect(result.current.open).toBe(true);

    act(() => {
      result.current.hide();
    });
    expect(result.current.open).toBe(false);
  });

  it("closes after hideSoon delay", () => {
    const { result } = renderHook(() => useHoverDropdown(200));

    act(() => {
      result.current.show();
    });
    expect(result.current.open).toBe(true);

    act(() => {
      result.current.hideSoon();
    });
    expect(result.current.open).toBe(true);

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.open).toBe(false);
  });

  it("cancels pending close when show is called again", () => {
    const { result } = renderHook(() => useHoverDropdown(150));

    act(() => {
      result.current.show();
      result.current.hideSoon();
      vi.advanceTimersByTime(100);
      result.current.show();
      vi.advanceTimersByTime(100);
    });

    expect(result.current.open).toBe(true);
  });

  it("provides rootProps with mouse enter/leave handlers", () => {
    const { result } = renderHook(() => useHoverDropdown());
    expect(typeof result.current.rootProps.onMouseEnter).toBe("function");
    expect(typeof result.current.rootProps.onMouseLeave).toBe("function");
  });

  it("toggles open state on trigger click for touch devices", () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));

    const { result } = renderHook(() => useHoverDropdown());

    act(() => {
      result.current.handleTriggerClick();
    });
    expect(result.current.open).toBe(true);

    act(() => {
      result.current.handleTriggerClick();
    });
    expect(result.current.open).toBe(false);

    vi.unstubAllGlobals();
  });
});
