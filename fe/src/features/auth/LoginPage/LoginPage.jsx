import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faEye, faEyeSlash, faLock } from "@fortawesome/free-solid-svg-icons";
import googleGSrc from "@/img/google-g.png";
import AuthBrandPanel from "@/features/auth/AuthBrandPanel/AuthBrandPanel";
import AccountPenaltyModal from "@/features/account/AccountPenaltyModal/AccountPenaltyModal";
import { DEMO_ACCOUNTS, useLoginForm } from "./useLoginForm";
import styles from "./LoginPage.module.css";

function LoginFieldError({ id, message }) {
  if (!message) {
    return null;
  }

  return (
    <span id={id} className={styles.fieldError} role="alert">
      {message}
    </span>
  );
}

function LoginPage() {
  const {
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
    clearBanPenalty,
  } = useLoginForm();

  return (
    <div className={styles.page}>
      <AccountPenaltyModal
        open={Boolean(banPenalty)}
        penalty={banPenalty}
        onClose={clearBanPenalty}
        variant="ban"
      />
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

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.fields}>
              <div className={styles.field}>
                <label htmlFor="login-email" className={styles.label}>
                  Email
                </label>
                <span
                  className={`${styles["input-wrap"]} ${
                    fieldErrors.email ? styles.inputInvalid : ""
                  }`}
                >
                  <FontAwesomeIcon icon={faEnvelope} className={styles["input-icon"]} />
                  <input
                    id="login-email"
                    type="email"
                    className={styles.input}
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      clearFieldError("email");
                      clearSubmitError();
                    }}
                    onBlur={() => handleFieldBlur("email")}
                    placeholder="example@gmail.com"
                    autoComplete="email"
                    required
                    maxLength={256}
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
                  />
                </span>
                <LoginFieldError id="login-email-error" message={fieldErrors.email} />
              </div>

              <div className={styles.field}>
                <label htmlFor="login-password" className={styles.label}>
                  Mật khẩu
                </label>
                <span
                  className={`${styles["input-wrap"]} ${
                    fieldErrors.password ? styles.inputInvalid : ""
                  }`}
                >
                  <FontAwesomeIcon icon={faLock} className={styles["input-icon"]} />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    className={styles.input}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      clearFieldError("password");
                      clearSubmitError();
                    }}
                    onBlur={() => handleFieldBlur("password")}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    maxLength={128}
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
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
                <LoginFieldError id="login-password-error" message={fieldErrors.password} />
              </div>

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

            {submitError ? (
              <p className={styles.submitError} role="alert">
                {submitError}
              </p>
            ) : null}

            <button
              type="submit"
              className={styles["submit-btn"]}
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
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
