import { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import { mapAccountPenaltyDto } from "@/features/account/accountPenaltyUtils";
import { getGoogleClientId, requestGoogleIdToken } from "@/utils/googleAuth";
import { getRoleHomePath } from "@/utils/roleHelpers";

const REMEMBER_KEY = "sehubs_remember_login";
const EMAIL_MAX = 256;
const PASSWORD_MAX = 128;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export const DEMO_ACCOUNTS = [
  {
    label: "Demo Student",
    username: "demo.student@sehub.local",
    password: "Demo@12345",
  },
  {
    label: "Moderator",
    username: "moderator@sehub.local",
    password: "Mod@12345",
  },
  {
    label: "Admin",
    username: "admin@sehub.local",
    password: "Admin@123",
  },
];

function isGuestOnlyPath(path) {
  if (!path || path === "/") return true;
  if (path === "/login" || path === "/register" || path.startsWith("/forgot-password")) {
    return true;
  }
  if (path === "/support") return true;
  if (path === "/community" || path.startsWith("/community/")) return true;
  return false;
}

function validateEmail(value) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "Vui lòng nhập email.";
  }

  if (trimmed.length > EMAIL_MAX) {
    return "Email không được quá 256 ký tự.";
  }

  if (!EMAIL_PATTERN.test(trimmed)) {
    return "Email không đúng định dạng.";
  }

  return null;
}

function validatePassword(password) {
  if (!password) {
    return "Vui lòng nhập mật khẩu.";
  }

  if (password.length > PASSWORD_MAX) {
    return "Mật khẩu không được quá 128 ký tự.";
  }

  return null;
}

function validateLoginForm(fields) {
  const errors = {};

  const emailError = validateEmail(fields.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(fields.password);
  if (passwordError) errors.password = passwordError;

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    values: {
      email: fields.email.trim(),
    },
  };
}

function validateLoginField(field, values) {
  switch (field) {
    case "email":
      return validateEmail(values.email) ?? "";
    case "password":
      return validatePassword(values.password) ?? "";
    default:
      return "";
  }
}

function readRememberedEmail(locationEmail) {
  if (locationEmail) {
    return locationEmail;
  }

  try {
    return localStorage.getItem(REMEMBER_KEY) ?? "";
  } catch {
    return "";
  }
}

export function useLoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { login, googleLogin } = useAuth();

  const redirectTo = location.state?.from || "/home";
  const initialEmail = readRememberedEmail(location.state?.email);

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(Boolean(initialEmail));
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [banPenalty, setBanPenalty] = useState(null);

  const formValues = { email, password };

  const navigateAfterLogin = useCallback(
    (loggedInUser) => {
      if (loggedInUser?.emailConfirmed === false) {
        showToast("Vui lòng xác minh email trước khi sử dụng các dịch vụ SEHub.");
        navigate("/verify-email", {
          replace: true,
          state: {
            email: loggedInUser.email,
            from: isGuestOnlyPath(redirectTo) ? "/home" : redirectTo,
            requestOtp: true,
          },
        });
        return;
      }

      const studentFallback = isGuestOnlyPath(redirectTo) ? "/home" : redirectTo;
      navigate(getRoleHomePath(loggedInUser, studentFallback), { replace: true });
    },
    [navigate, redirectTo, showToast],
  );

  const persistRememberMe = useCallback(
    (identifier) => {
      try {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_KEY, identifier);
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }
      } catch {
        /* ignore storage errors */
      }
    },
    [rememberMe],
  );

  const clearFieldError = useCallback((field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }

      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleFieldBlur = useCallback(
    (field) => {
      const message = validateLoginField(field, formValues);
      setFieldErrors((prev) => {
        const next = { ...prev };
        if (message) {
          next[field] = message;
        } else {
          delete next[field];
        }
        return next;
      });
    },
    [formValues],
  );

  const handleLoginError = useCallback(
    (error) => {
      const errorCode = error?.errors?.[0]?.code;

      if (errorCode === "ACCOUNT_BANNED" && error?.data) {
        setBanPenalty(mapAccountPenaltyDto(error.data));
        setSubmitError("");
        setIsSubmitting(false);
        return;
      }

      setSubmitError(error?.message ?? "Email hoặc mật khẩu không đúng.");
      setIsSubmitting(false);
    },
    [],
  );

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setSubmitError("");

      const validation = validateLoginForm(formValues);
      if (!validation.ok) {
        setFieldErrors(validation.errors);
        return;
      }

      setFieldErrors({});
      setIsSubmitting(true);
      persistRememberMe(validation.values.email);

      try {
        const nextUser = await login({
          username: validation.values.email,
          password,
        });
        navigateAfterLogin(nextUser);
      } catch (error) {
        handleLoginError(error);
      }
    },
    [formValues, password, login, persistRememberMe, navigateAfterLogin, handleLoginError],
  );

  const fillTestAccount = useCallback(
    async (account) => {
      setEmail(account.username);
      setPassword(account.password);
      setRememberMe(true);
      setFieldErrors({});
      setSubmitError("");
      setIsSubmitting(true);

      try {
        const nextUser = await login({
          username: account.username,
          password: account.password,
        });
        try {
          localStorage.setItem(REMEMBER_KEY, account.username);
        } catch {
          /* ignore storage errors */
        }
        navigateAfterLogin(nextUser);
      } catch (error) {
        handleLoginError(error);
      }
    },
    [login, navigateAfterLogin, handleLoginError],
  );

  const handleGoogleLogin = useCallback(async () => {
    setSubmitError("");

    if (!getGoogleClientId()) {
      setSubmitError("Chưa cấu hình Google Client ID (VITE_GOOGLE_CLIENT_ID).");
      return;
    }

    setIsSubmitting(true);
    try {
      const idToken = await requestGoogleIdToken();
      const nextUser = await googleLogin(idToken);
      navigateAfterLogin(nextUser);
    } catch (error) {
      setSubmitError(error?.message ?? "Đăng nhập Google thất bại.");
      setIsSubmitting(false);
    }
  }, [googleLogin, navigateAfterLogin]);

  const clearSubmitError = useCallback(() => {
    setSubmitError("");
  }, []);

  return {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    showPassword,
    setShowPassword,
    isSubmitting,
    fieldErrors,
    submitError,
    clearFieldError,
    clearSubmitError,
    handleFieldBlur,
    handleSubmit,
    fillTestAccount,
    handleGoogleLogin,
    banPenalty,
    clearBanPenalty: () => setBanPenalty(null),
  };
}
