import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faEye,
  faEyeSlash,
  faKey,
  faLock,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import googleGSrc from "@/img/google-g.png";
import AuthBrandPanel from "@/features/auth/AuthBrandPanel/AuthBrandPanel";
import { useRegisterForm } from "./useRegisterForm";
import styles from "./RegisterPage.module.css";

function RegisterFieldError({ id, message }) {
  if (!message) {
    return null;
  }

  return (
    <span id={id} className={styles.fieldError} role="alert">
      {message}
    </span>
  );
}

function RegisterPage() {
  const {
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
  } = useRegisterForm();

  return (
    <div className={styles.page}>
      <AuthBrandPanel variant="register" />

      <section className={styles.formSection} aria-labelledby="register-title">
        <div className={styles.formMain}>
          <div className={styles.formWrap}>
          <div className={styles.formCard}>
          <header className={styles.header}>
            <span className={styles.eyebrow}>Đăng ký</span>
            <h1 id="register-title" className={styles.title}>
              Bắt đầu hành trình của bạn!
            </h1>
            <p className={styles.subtitle}>
              Tạo tài khoản để khám phá kho đề thi và kết nối cộng đồng SEHub.
            </p>
          </header>

          <form className={styles.form} onSubmit={handleSubmit} noValidate autoComplete="off">
            <div className={styles.fields}>
              <label className={styles.field}>
                <span className={styles.label}>Họ và tên</span>
                <span
                  className={`${styles["input-wrap"]} ${
                    fieldErrors.fullName ? styles.inputInvalid : ""
                  }`}
                >
                  <FontAwesomeIcon icon={faUser} className={styles["input-icon"]} />
                  <input
                    type="text"
                    className={styles.input}
                    value={fullName}
                    onChange={(event) => {
                      setFullName(event.target.value);
                      clearFieldError("fullName");
                    }}
                    onBlur={() => handleFieldBlur("fullName")}
                    placeholder="Nhập họ và tên của bạn"
                    autoComplete="name"
                    required
                    maxLength={100}
                    aria-invalid={Boolean(fieldErrors.fullName)}
                    aria-describedby={fieldErrors.fullName ? "register-fullName-error" : undefined}
                  />
                </span>
                <RegisterFieldError id="register-fullName-error" message={fieldErrors.fullName} />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Email</span>
                <span
                  className={`${styles["input-wrap"]} ${
                    fieldErrors.email ? styles.inputInvalid : ""
                  }`}
                >
                  <FontAwesomeIcon icon={faEnvelope} className={styles["input-icon"]} />
                  <input
                    type="email"
                    className={styles.input}
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      clearFieldError("email");
                    }}
                    onBlur={() => handleFieldBlur("email")}
                    placeholder="example@sehub.ai"
                    autoComplete="email"
                    required
                    maxLength={256}
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? "register-email-error" : undefined}
                  />
                </span>
                <RegisterFieldError id="register-email-error" message={fieldErrors.email} />
              </label>

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span className={styles.label}>Mật khẩu</span>
                  <span
                    className={`${styles["input-wrap"]} ${
                      fieldErrors.password ? styles.inputInvalid : ""
                    }`}
                  >
                    <FontAwesomeIcon icon={faLock} className={styles["input-icon"]} />
                    <input
                      type={showPassword ? "text" : "password"}
                      className={styles.input}
                      name="sehubs-register-secret"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        clearFieldError("password");
                        if (fieldErrors.confirmPassword) {
                          clearFieldError("confirmPassword");
                        }
                      }}
                      onBlur={() => handleFieldBlur("password")}
                      onFocus={(event) => {
                        event.currentTarget.readOnly = false;
                      }}
                      readOnly
                      placeholder="••••••••"
                      autoComplete="off"
                      data-1p-ignore
                      data-lpignore="true"
                      required
                      minLength={8}
                      maxLength={128}
                      aria-invalid={Boolean(fieldErrors.password)}
                      aria-describedby={fieldErrors.password ? "register-password-error" : undefined}
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
                  <RegisterFieldError id="register-password-error" message={fieldErrors.password} />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Xác nhận mật khẩu</span>
                  <span
                    className={`${styles["input-wrap"]} ${
                      fieldErrors.confirmPassword ? styles.inputInvalid : ""
                    }`}
                  >
                    <FontAwesomeIcon icon={faKey} className={styles["input-icon"]} />
                    <input
                      type={showPassword ? "text" : "password"}
                      className={styles.input}
                      name="sehubs-register-secret-confirm"
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        clearFieldError("confirmPassword");
                      }}
                      onBlur={() => handleFieldBlur("confirmPassword")}
                      onFocus={(event) => {
                        event.currentTarget.readOnly = false;
                      }}
                      readOnly
                      placeholder="••••••••"
                      autoComplete="off"
                      data-1p-ignore
                      data-lpignore="true"
                      required
                      minLength={8}
                      maxLength={128}
                      aria-invalid={Boolean(fieldErrors.confirmPassword)}
                      aria-describedby={
                        fieldErrors.confirmPassword ? "register-confirmPassword-error" : undefined
                      }
                    />
                  </span>
                  <RegisterFieldError
                    id="register-confirmPassword-error"
                    message={fieldErrors.confirmPassword}
                  />
                </label>
              </div>
            </div>

            <button type="submit" className={styles["submit-btn"]} disabled={isSubmitting}>
              Đăng ký ngay
            </button>

            <div className={styles.divider} role="separator">
              <span>Hoặc</span>
            </div>

            <button type="button" className={styles["google-btn"]} onClick={handleGoogleSignup}>
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
              Đã có tài khoản?{" "}
              <Link to="/login" className={styles["login-link"]}>
                Đăng nhập ngay
              </Link>
            </p>

            <p className={styles.tagline}>EMPOWERING STUDENTS GLOBALLY</p>
          </form>
          </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default RegisterPage;
