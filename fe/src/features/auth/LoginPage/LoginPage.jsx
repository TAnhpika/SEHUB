import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faEye, faEyeSlash, faLock } from "@fortawesome/free-solid-svg-icons";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import { getGoogleClientId, requestGoogleIdToken } from "@/utils/googleAuth";
import googleGSrc from "@/img/google-g.png";
import { getRoleHomePath } from "@/utils/roleHelpers";
import AuthBrandPanel from "@/features/auth/AuthBrandPanel/AuthBrandPanel";
import styles from "./LoginPage.module.css";

const DEMO_ACCOUNTS = [
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

const REMEMBER_KEY = "sehubs_remember_login";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, googleLogin } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState(() => {
    if (location.state?.email) {
      return location.state.email;
    }
    try {
      return localStorage.getItem(REMEMBER_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(Boolean(email));
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = location.state?.from || "/home";

  function isGuestOnlyPath(path) {
    if (!path || path === "/") return true;
    if (path === "/login" || path === "/register" || path.startsWith("/forgot-password")) {
      return true;
    }
    if (path === "/support") return true;
    if (path === "/community" || path.startsWith("/community/")) return true;
    return false;
  }

  function navigateAfterLogin(loggedInUser) {
    const isStaff =
      loggedInUser?.role === "moderator" || loggedInUser?.role === "admin";
    const studentFallback = isGuestOnlyPath(redirectTo) ? "/home" : redirectTo;
    const destination = isStaff
      ? getRoleHomePath(loggedInUser)
      : getRoleHomePath(loggedInUser, studentFallback);
    navigate(destination, { replace: true });
  }

  function persistRememberMe() {
    try {
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, email.trim());
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
    } catch {
      /* ignore storage errors */
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    persistRememberMe();

    try {
      const nextUser = await login({ username: email.trim(), password });
      navigateAfterLogin(nextUser);
    } catch (error) {
      const errorCode = error?.errors?.[0]?.code;
      if (errorCode === "EMAIL_NOT_CONFIRMED") {
        navigate("/verify-email", {
          replace: true,
          state: { email: email.trim(), from: redirectTo },
        });
        return;
      }
      showToast(error?.message ?? "Đăng nhập thất bại.");
      setIsSubmitting(false);
    }
  }

  async function fillTestAccount(account) {
    setEmail(account.username);
    setPassword(account.password);
    setRememberMe(true);
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
      const errorCode = error?.errors?.[0]?.code;
      if (errorCode === "EMAIL_NOT_CONFIRMED") {
        navigate("/verify-email", {
          replace: true,
          state: { email: account.username, from: redirectTo },
        });
        return;
      }
      showToast(error?.message ?? "Đăng nhập thất bại.");
      setIsSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    if (!getGoogleClientId()) {
      showToast("Chưa cấu hình Google Client ID (VITE_GOOGLE_CLIENT_ID).");
      return;
    }

    setIsSubmitting(true);
    try {
      const idToken = await requestGoogleIdToken();
      const nextUser = await googleLogin(idToken);
      navigateAfterLogin(nextUser);
    } catch (error) {
      showToast(error?.message ?? "Đăng nhập Google thất bại.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <AuthBrandPanel variant="login" />

      <section className={styles.formSection} aria-labelledby="login-title">
        <div className={styles.formMain}>
          <div className={styles.formWrap}>
          <div className={styles.formCard}>
          <header className={styles.header}>
            <span className={styles.eyebrow}>Đăng nhập</span>
            <h1 id="login-title" className={styles.title}>
              Chào mừng bạn quay trở lại!
            </h1>
            <p className={styles.subtitle}>
              Nhập thông tin tài khoản để tiếp tục học tập trên SEHub.
            </p>
          </header>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.fields}>
              <label className={styles.field}>
                <span className={styles.label}>Email</span>
                <span className={styles["input-wrap"]}>
                  <FontAwesomeIcon icon={faEnvelope} className={styles["input-icon"]} />
                  <input
                    type="text"
                    className={styles.input}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="example@gmail.com"
                    autoComplete="username"
                    required
                  />
                </span>
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Mật khẩu</span>
                <span className={styles["input-wrap"]}>
                  <FontAwesomeIcon icon={faLock} className={styles["input-icon"]} />
                  <input
                    type={showPassword ? "text" : "password"}
                    className={styles.input}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className={styles["toggle-password"]}
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                </span>
              </label>

              <div className={styles["meta-row"]}>
                <label className={styles.remember}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  <span>Ghi nhớ đăng nhập</span>
                </label>

                <Link to="/forgot-password" className={styles["forgot-link"]}>
                  Quên mật khẩu?
                </Link>
              </div>
            </div>

            <button type="submit" className={styles["submit-btn"]} disabled={isSubmitting}>
              Đăng nhập
            </button>

            <div className={styles.divider} role="separator">
              <span>Hoặc</span>
            </div>

            <button type="button" className={styles["google-btn"]} onClick={handleGoogleLogin}>
              <img
                src={googleGSrc}
                alt=""
                className={styles["google-icon"]}
                decoding="async"
                aria-hidden="true"
              />
              Tiếp tục với Google
            </button>

            <p className={styles.footer}>
              Chưa có tài khoản?{" "}
              <Link to="/register" className={styles["register-link"]}>
                Đăng ký ngay
              </Link>
            </p>

            <p className={styles.tagline}>EMPOWERING STUDENTS GLOBALLY</p>
          </form>
          </div>

          {import.meta.env.DEV && (
            <details className={styles.devAccounts}>
              <summary className={styles.devSummary}>Tài khoản demo (API)</summary>
              <ul className={styles.devList}>
                {DEMO_ACCOUNTS.map((account) => (
                  <li key={account.username}>
                    <button
                      type="button"
                      className={styles.devBtn}
                      onClick={() => fillTestAccount(account)}
                      disabled={isSubmitting}
                    >
                      {account.label}: <code>{account.username}</code> /{" "}
                      <code>{account.password}</code>
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default LoginPage;
