import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faEye,
  faEyeSlash,
  faKey,
  faLock,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useToast } from "@/common/Toast/ToastProvider";
import googleGSrc from "@/img/google-g.png";
import { useAuth } from "@/context";
import AuthBrandPanel from "@/features/auth/AuthBrandPanel/AuthBrandPanel";
import styles from "./RegisterPage.module.css";

function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (password !== confirmPassword) {
      showToast("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (password.length < 6) {
      showToast("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setIsSubmitting(true);
    register({ fullName: fullName.trim(), email: email.trim(), password });
    navigate("/home", { replace: true });
  }

  function handleGoogleSignup() {
    register({ fullName: "Google User", email: "google_user@sehub.ai", password: "" });
    navigate("/home", { replace: true });
  }

  return (
    <div className={styles.page}>
      <AuthBrandPanel variant="register" />

      <section className={styles.formSection} aria-labelledby="register-title">
        <div className={styles.formMain}>
          <div className={styles.formWrap}>
          <header className={styles.header}>
            <h1 id="register-title" className={styles.title}>
              Tạo tài khoản mới
            </h1>
            <p className={styles.subtitle}>
              Bắt đầu hành trình học tập thông minh cùng SEHub
            </p>
          </header>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.fields}>
              <label className={styles.field}>
                <span className={styles.label}>Họ và tên</span>
                <span className={styles["input-wrap"]}>
                  <FontAwesomeIcon icon={faUser} className={styles["input-icon"]} />
                  <input
                    type="text"
                    className={styles.input}
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Nhập họ và tên của bạn"
                    autoComplete="name"
                    required
                  />
                </span>
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Email</span>
                <span className={styles["input-wrap"]}>
                  <FontAwesomeIcon icon={faEnvelope} className={styles["input-icon"]} />
                  <input
                    type="email"
                    className={styles.input}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="example@sehub.ai"
                    autoComplete="email"
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
                    autoComplete="new-password"
                    required
                    minLength={6}
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

              <label className={styles.field}>
                <span className={styles.label}>Xác nhận mật khẩu</span>
                <span className={styles["input-wrap"]}>
                  <FontAwesomeIcon icon={faKey} className={styles["input-icon"]} />
                  <input
                    type={showPassword ? "text" : "password"}
                    className={styles.input}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    minLength={6}
                  />
                </span>
              </label>
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
          </form>
          </div>
        </div>

        <p className={styles.tagline}>EMPOWERING STUDENTS GLOBALLY</p>
      </section>
    </div>
  );
}

export default RegisterPage;
