const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let scriptPromise = null;

function loadGoogleScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${GIS_SCRIPT_SRC}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Không tải được Google Sign-In.")));
        return;
      }

      const script = document.createElement("script");
      script.src = GIS_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Không tải được Google Sign-In."));
      document.head.appendChild(script);
    });
  }

  return scriptPromise;
}

export function getGoogleClientId() {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || "";
}

function isValidGoogleClientId(clientId) {
  return /^[\w-]+\.apps\.googleusercontent\.com$/.test(clientId);
}

export async function requestGoogleIdToken() {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error("Chưa cấu hình VITE_GOOGLE_CLIENT_ID.");
  }
  if (!isValidGoogleClientId(clientId)) {
    throw new Error("VITE_GOOGLE_CLIENT_ID không hợp lệ. Kiểm tra lại Google Cloud Console.");
  }

  await loadGoogleScript();

  return new Promise((resolve, reject) => {
    let settled = false;
    let container = null;
    let timeoutId = null;

    const finish = (action) => {
      if (settled) return;
      settled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      container?.remove();
      action();
    };

    container = document.createElement("div");
    container.style.cssText = "position:fixed;left:-9999px;top:-9999px;";
    document.body.appendChild(container);

    timeoutId = window.setTimeout(() => {
      finish(() => reject(new Error("Hết thời gian đăng nhập Google. Vui lòng thử lại.")));
    }, 120000);

    window.google.accounts.id.initialize({
      client_id: clientId,
      ux_mode: "popup",
      callback: (response) => {
        if (response?.credential) {
          finish(() => resolve(response.credential));
        } else {
          finish(() => reject(new Error("Google không trả về ID token.")));
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    window.google.accounts.id.renderButton(container, {
      type: "standard",
      theme:
        typeof document !== "undefined" &&
        document.documentElement.dataset.theme === "dark"
          ? "filled_black"
          : "outline",
      size: "large",
      text: "signin_with",
      width: 280,
    });

    const tryClick = (attempts = 0) => {
      const button = container.querySelector('[role="button"]');
      if (button) {
        button.click();
        return;
      }
      if (attempts < 30) {
        window.setTimeout(() => tryClick(attempts + 1), 100);
        return;
      }
      finish(() => reject(new Error("Không thể khởi tạo đăng nhập Google. Hãy restart dev server và thử lại.")));
    };

    tryClick();
  });
}
