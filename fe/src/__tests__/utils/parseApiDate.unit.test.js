import { describe, expect, it } from "vitest";
import {
  formatDateTimeFromApi,
  formatIsoLocalDateTime,
  formatRelativeTime,
  formatRelativeTimeFromApi,
  parseApiDate,
} from "@/utils/parseApiDate";

describe("parseApiDate re-exports", () => {
  it("re-exports parseApiDate from dateTime module", () => {
    const date = parseApiDate("2026-07-10T08:00:00Z");
    expect(date?.toISOString()).toBe("2026-07-10T08:00:00.000Z");
  });

  it("re-exports formatting helpers", () => {
    expect(typeof formatRelativeTime).toBe("function");
    expect(typeof formatRelativeTimeFromApi).toBe("function");
    expect(typeof formatDateTimeFromApi).toBe("function");
    expect(typeof formatIsoLocalDateTime).toBe("function");
  });

  it("returns null for invalid dates through re-exported parseApiDate", () => {
    expect(parseApiDate("invalid")).toBe(null);
  });
});
