import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import { getGoogleClientId, requestGoogleIdToken } from "@/utils/googleAuth";
import { getRoleHomePath } from "@/utils/roleHelpers";

const DISPLAY_NAME_MIN = 2;
const DISPLAY_NAME_MAX = 100;
const EMAIL_MAX = 256;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const DISPLAY_NAME_HAS_LETTER = /[A-Za-zÀ-ỹĂăÂâĐđÊêÔôƠơƯư]/;
const DISPLAY_NAME_ALLOWED = /^[\p{L}\p{M}0-9\s'.-]+$/u;

function normalizeFullName(value) {
  return value.trim().replace(/\s+/g, " ");
}

function isDigitsOnlyName(value) {
  return /^\d+$/.test(value.replace(/\s/g, ""));
}

function validateFullName(fullName) {
  const trimmedName = normalizeFullName(fullName);

  if (!trimmedName) {
    return "Vui lòng nhập họ và tên.";
  }

  if (trimmedName.length < DISPLAY_NAME_MIN) {
    return "Họ và tên phải có ít nhất 2 ký tự.";
  }

  if (trimmedName.length > DISPLAY_NAME_MAX) {
    return "Họ và tên không được quá 100 ký tự.";
  }

  if (isDigitsOnlyName(trimmedName)) {
    return "Họ và tên không được điền toàn số.";
  }

  if (!DISPLAY_NAME_HAS_LETTER.test(trimmedName)) {
    return "Họ và tên phải có ít nhất một chữ cái.";
  }

  if (!DISPLAY_NAME_ALLOWED.test(trimmedName)) {
    return "Họ và tên chỉ được chứa chữ cái, số, khoảng trắng, dấu gạch ngang hoặc nháy đơn.";
  }

  return null;
}

function validateEmail(email) {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return "Vui lòng nhập email.";
  }

  if (trimmedEmail.length > EMAIL_MAX) {
    return "Email không được quá 256 ký tự.";
  }

  if (!EMAIL_PATTERN.test(trimmedEmail)) {
    return "Email không đúng định dạng.";
  }

  return null;
}

function validatePassword(password) {
  if (!password) {
    return "Vui lòng nhập mật khẩu.";
  }

  if (password.length < PASSWORD_MIN) {
    return "Mật khẩu phải có ít nhất 8 ký tự.";
  }

  if (password.length > PASSWORD_MAX) {
    return "Mật khẩu không được quá 128 ký tự.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Mật khẩu cần có ít nhất một chữ hoa.";
  }

  if (!/[a-z]/.test(password)) {
    return "Mật khẩu cần có ít nhất một chữ thường.";
  }

  if (!/\d/.test(password)) {
    return "Mật khẩu cần có ít nhất một chữ số.";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Mật khẩu cần có ít nhất một ký tự đặc biệt.";
  }

  return null;
}

function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) {
    return "Vui lòng xác nhận mật khẩu.";
  }

  if (password !== confirmPassword) {
    return "Mật khẩu xác nhận không khớp.";
  }

  return null;
}

function validateRegisterForm(fields) {
  const errors = {};

  const fullNameError = validateFullName(fields.fullName);
  if (fullNameError) errors.fullName = fullNameError;

  const emailError = validateEmail(fields.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(fields.password);
  if (passwordError) errors.password = passwordError;

  const confirmPasswordError = validateConfirmPassword(
    fields.password,
    fields.confirmPassword,
  );
  if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    values: {
      fullName: normalizeFullName(fields.fullName),
      email: fields.email.trim(),
    },
  };
}

function validateRegisterField(field, values) {
  switch (field) {
    case "fullName":
      return validateFullName(values.fullName) ?? "";
    case "email":
      return validateEmail(values.email) ?? "";
    case "password":
      return validatePassword(values.password) ?? "";
    case "confirmPassword":
      return validateConfirmPassword(values.password, values.confirmPassword) ?? "";
    default:
      return "";
  }
}

export function useRegisterForm() {
  const navigate = useNavigate();
  const { googleLogin, register } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const formValues = { fullName, email, password, confirmPassword };

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
      const message = validateRegisterField(field, formValues);
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

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      const validation = validateRegisterForm(formValues);
      if (!validation.ok) {
        setFieldErrors(validation.errors);
        const firstError = Object.values(validation.errors)[0];
        if (firstError) {
          showToast(firstError);
        }
        return;
      }

      setFieldErrors({});
      setIsSubmitting(true);

      const { fullName: trimmedName, email: trimmedEmail } = validation.values;

      try {
        await register({
          fullName: trimmedName,
          email: trimmedEmail,
          password,
        });
        showToast("Đăng ký thành công. Kiểm tra email để lấy mã xác minh.");
        navigate("/verify-email", {
          replace: true,
          state: { email: trimmedEmail, from: "/home" },
        });
      } catch (error) {
        showToast(error?.message ?? "Đăng ký thất bại.");
        setIsSubmitting(false);
      }
    },
    [formValues, password, navigate, register, showToast],
  );

  const handleGoogleSignup = useCallback(async () => {
    if (!getGoogleClientId()) {
      showToast("Chưa cấu hình Google Client ID (VITE_GOOGLE_CLIENT_ID).");
      return;
    }

    setIsSubmitting(true);
    try {
      const nextUser = await googleLogin(await requestGoogleIdToken());
      navigate(getRoleHomePath(nextUser), { replace: true });
    } catch (error) {
      showToast(error?.message ?? "Đăng ký Google thất bại.");
      setIsSubmitting(false);
    }
  }, [googleLogin, navigate, showToast]);

  return {
    fullName,
    setFullName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    isSubmitting,
    fieldErrors,
    clearFieldError,
    handleFieldBlur,
    handleSubmit,
    handleGoogleSignup,
  };
}
