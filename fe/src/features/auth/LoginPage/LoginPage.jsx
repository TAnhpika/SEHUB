import { useState } from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faEye, faEyeSlash, faLock } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { useAuth } from "@/context/AuthContext";
import AuthBrandPanel from "@/features/auth/AuthBrandPanel/AuthBrandPanel";
import styles from "./LoginPage.module.css";

const REMEMBER_KEY = "sehubs_remember_login";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
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

  const redirectTo = location.state?.from || "/home";

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, email.trim());
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
    } catch {
      /* ignore storage errors */
    }

    login({ username: email.trim(), password });
    navigate(redirectTo, { replace: true });
  }

  function handleGoogleLogin() {
    login({ username: "google_user", password: "" });
    navigate(redirectTo, { replace: true });
  }

  return (
    <div className={styles.page}>
      <AuthBrandPanel />

      <section className={styles.formSection} aria-labelledby="login-title">
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

            <button type="submit" className={styles["submit-btn"]} disabled={isSubmitting}>
              Đăng nhập
            </button>

            <div className={styles.divider} role="separator">
              <span>Hoặc</span>
            </div>

            <button type="button" className={styles["google-btn"]} onClick={handleGoogleLogin}>
              <FontAwesomeIcon icon={faGoogle} className={styles["google-icon"]} />
              Tiếp tục với Google
            </button>

            <p className={styles.footer}>
              Chưa có tài khoản?{" "}
              <Link to="/register" className={styles["register-link"]}>
                Đăng ký ngay
              </Link>
            </p>
          </form>

          <p className={styles.tagline}>EMPOWERING STUDENTS GLOBALLY</p>
        </div>
      </section>
    </div>
  );
}

export default LoginPage;
