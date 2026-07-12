import React from "react";
import { MemoryRouter } from "react-router-dom";
import { renderHook } from "@testing-library/react";
import { vi } from "vitest";

/**
 * @param {import('@testing-library/react').RenderHookOptions<any>['initialProps']} callback
 * @param {{ initialEntries?: string[] }} [options]
 */
export function renderHookWithRouter(callback, { initialEntries = ["/"] } = {}) {
  const wrapper = ({ children }) =>
    React.createElement(MemoryRouter, { initialEntries }, children);
  return renderHook(callback, { wrapper });
}

export function createMockNavigate() {
  return vi.fn();
}

export function createMockToast() {
  return {
    showToast: vi.fn(),
    showCountdownToast: vi.fn(),
    hideToast: vi.fn(),
  };
}

export function createMockAuth(overrides = {}) {
  return {
    isAuthenticated: false,
    isPremium: false,
    user: null,
    ...overrides,
  };
}
