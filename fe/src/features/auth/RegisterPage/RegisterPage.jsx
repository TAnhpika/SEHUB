import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { getGoogleClientId, requestGoogleIdToken } from "@/utils/googleAuth";
import { getRoleHomePath } from "@/utils/roleHelpers";
import AuthBrandPanel from "@/features/auth/AuthBrandPanel/AuthBrandPanel";
import styles from "./RegisterPage.module.css";

function RegisterPage() {
  const navigate = useNavigate();
  const { googleLogin, register } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (password !== confirmPassword) {
      showToast("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (password.length < 8) {
      showToast("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      showToast("Mật khẩu cần có chữ hoa, chữ thường, số và ký tự đặc biệt.");
      return;
    }

    setIsSubmitting(true);

    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();

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
  }

  async function handleGoogleSignup() {
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
  }

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

              <div className={styles.fieldRow}>
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
                      minLength={8}
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
                      minLength={8}
                    />
                  </span>
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
