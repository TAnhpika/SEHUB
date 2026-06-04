import { useState } from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faEye, faEyeSlash, faLock } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context";
import googleGSrc from "@/img/google-g.png";
import { MODERATOR_LOGIN_ACCOUNTS } from "@/features/moderator/moderatorMockData";
import {
  isModeratorRole,
  MODERATOR_HOME_PATH,
} from "@/features/moderator/moderatorNavData";
import AuthBrandPanel from "@/features/auth/AuthBrandPanel/AuthBrandPanel";
import styles from "./LoginPage.module.css";

const REMEMBER_KEY = "sehubs_remember_login";

function getPostLoginPath(user, fallback = "/home") {
  return isModeratorRole(user) ? MODERATOR_HOME_PATH : fallback;
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();
  const redirectTo = location.state?.from || "/home";
  const [email, setEmail] = useState(() => {
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

  if (isAuthenticated) {
    return <Navigate to={getPostLoginPath(user, redirectTo)} replace />;
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

  function navigateAfterLogin(loggedInUser) {
    navigate(getPostLoginPath(loggedInUser, redirectTo), { replace: true });
  }

  function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    persistRememberMe();

    const loggedInUser = login({ username: email.trim(), password });
    navigateAfterLogin(loggedInUser);
  }

  function fillTestAccount(account) {
    setEmail(account.username);
    setPassword(account.password);
    setRememberMe(true);

    const loggedInUser = login({
      username: account.username,
      password: account.password,
    });
    try {
      localStorage.setItem(REMEMBER_KEY, account.username);
    } catch {
      /* ignore storage errors */
    }
    navigateAfterLogin(loggedInUser);
  }

  function handleGoogleLogin() {
    setIsSubmitting(true);
    const loggedInUser = login({ username: "google_user", password: "" });
    navigateAfterLogin(loggedInUser);
  }

  return (
    <div className={styles.page}>
      <AuthBrandPanel variant="login" />

      <section className={styles.formSection} aria-labelledby="login-title">
        <div className={styles.formMain}>
          <div className={styles.formWrap}>
          <header className={styles.header}>
            <h1 id="login-title" className={styles.title}>
              Đăng nhập
            </h1>
            <p className={styles.subtitle}>Chào mừng bạn quay trở lại!</p>
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
          </form>

          {import.meta.env.DEV && (
            <details className={styles.devAccounts}>
              <summary className={styles.devSummary}>Tài khoản test (dev)</summary>
              <ul className={styles.devList}>
                {MODERATOR_LOGIN_ACCOUNTS.map((account) => (
                  <li key={account.username}>
                    <button
                      type="button"
                      className={styles.devBtn}
                      onClick={() => fillTestAccount(account)}
                    >
                      {account.roleLabel}: <code>{account.username}</code> /{" "}
                      <code>{account.password}</code>
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
          </div>
        </div>

        <p className={styles.tagline}>EMPOWERING STUDENTS GLOBALLY</p>
      </section>
    </div>
  );
}

export default LoginPage;
