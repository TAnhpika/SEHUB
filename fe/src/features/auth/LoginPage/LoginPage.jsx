import { useState } from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { useAuth } from "@/context/AuthContext";
import { MODERATOR_TEST_ACCOUNTS } from "@/features/moderator/moderatorMockData";
import logoSrc from "@/img/logo.png";
import styles from "./LoginPage.module.css";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = location.state?.from || "/home";

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);

    const loggedInUser = login({ username, password });
    const destination =
      loggedInUser?.role === "moderator" || loggedInUser?.role === "admin"
        ? "/moderator/practice-exams/add"
        : redirectTo;
    navigate(destination, { replace: true });
  }

  function fillTestAccount(account) {
    setUsername(account.username);
    setPassword(account.password);
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link to="/" className={styles.brand}>
          <img src={logoSrc} alt="" className={styles.logo} decoding="async" aria-hidden="true" />
          <span>SEHub</span>
        </Link>

        <h1 className={styles.title}>Đăng nhập</h1>
        <p className={styles.subtitle}>Chào mừng trở lại cộng đồng sinh viên FPT</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>Email hoặc username</span>
            <input
              type="text"
              className={styles.input}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="minhpt_se"
              autoComplete="username"
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Mật khẩu</span>
            <div className={styles["password-wrap"]}>
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
            </div>
          </label>

          <div className={styles.meta}>
            <Link to="/forgot-password" className={styles.link}>
              Quên mật khẩu?
            </Link>
          </div>

          <Button type="submit" fullWidth size="lg" disabled={isSubmitting} className={styles.submit}>
            Đăng nhập
            <FontAwesomeIcon icon={faArrowRight} />
          </Button>
        </form>

        {import.meta.env.DEV && (
          <div className={styles.devAccounts}>
            <p className={styles.devTitle}>Tài khoản test Moderator</p>
            <ul className={styles.devList}>
              {MODERATOR_TEST_ACCOUNTS.map((account) => (
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
          </div>
        )}

        <p className={styles.footer}>
          Chưa có tài khoản? <Link to="/register">Đăng ký miễn phí</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
