import { afterEach, beforeEach, vi } from "vitest";

const storage = new Map();

function createStorageMock() {
  return {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
      storage.set(String(key), String(value));
    },
    removeItem(key) {
      storage.delete(key);
    },
    clear() {
      storage.clear();
    },
    get length() {
      return storage.size;
    },
    key(index) {
      return Array.from(storage.keys())[index] ?? null;
    },
  };
}

beforeEach(() => {
  storage.clear();
  vi.stubGlobal("localStorage", createStorageMock());
  vi.stubGlobal("sessionStorage", createStorageMock());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
