import { describe, expect, it } from "vitest";
import {
  PREMIUM_USERNAME_CLASS,
  withPremiumUsernameClass,
} from "@/utils/premiumNameClass";

describe("premiumNameClass", () => {
  describe("PREMIUM_USERNAME_CLASS", () => {
    it("exports the expected CSS class token", () => {
      expect(PREMIUM_USERNAME_CLASS).toBe("username-premium");
    });
  });

  describe("withPremiumUsernameClass", () => {
    it("returns original class when user is not premium", () => {
      expect(withPremiumUsernameClass("user-name", false)).toBe("user-name");
      expect(withPremiumUsernameClass(undefined, false)).toBe("");
    });

    it("appends premium class to existing className", () => {
      expect(withPremiumUsernameClass("user-name", true)).toBe(
        "user-name username-premium",
      );
    });

    it("returns only premium class when base class is empty", () => {
      expect(withPremiumUsernameClass("", true)).toBe(PREMIUM_USERNAME_CLASS);
      expect(withPremiumUsernameClass(null, true)).toBe(PREMIUM_USERNAME_CLASS);
    });
  });
});
