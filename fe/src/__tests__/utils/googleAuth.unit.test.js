import { afterEach, describe, expect, it, vi } from "vitest";
import { getGoogleClientId, requestGoogleIdToken } from "@/utils/googleAuth";

describe("googleAuth", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe("getGoogleClientId", () => {
    it("returns trimmed VITE_GOOGLE_CLIENT_ID from env", () => {
      vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "  my-client.apps.googleusercontent.com  ");
      expect(getGoogleClientId()).toBe("my-client.apps.googleusercontent.com");
    });

    it("returns empty string when env is unset", () => {
      vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "");
      expect(getGoogleClientId()).toBe("");
    });
  });

  describe("requestGoogleIdToken", () => {
    it("throws when client ID is not configured", async () => {
      vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "");
      await expect(requestGoogleIdToken()).rejects.toThrow("Chưa cấu hình VITE_GOOGLE_CLIENT_ID.");
    });

    it("throws when client ID format is invalid", async () => {
      vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "not-a-valid-client-id");
      await expect(requestGoogleIdToken()).rejects.toThrow("VITE_GOOGLE_CLIENT_ID không hợp lệ");
    });

    it("initializes Google Sign-In when client is already loaded", async () => {
      vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "123456789.apps.googleusercontent.com");

      const initialize = vi.fn();
      const renderButton = vi.fn();
      window.google = {
        accounts: {
          id: { initialize, renderButton },
        },
      };

      const promise = requestGoogleIdToken();
      await Promise.resolve();
      await Promise.resolve();

      expect(initialize).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: "123456789.apps.googleusercontent.com",
          ux_mode: "popup",
        }),
      );
      expect(renderButton).toHaveBeenCalled();

      promise.catch(() => {});
    });
  });
});
