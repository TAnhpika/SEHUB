import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight, faClock } from "@fortawesome/free-solid-svg-icons";
import * as authApi from "@/api/authApi";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import { getRoleHomePath } from "@/utils/roleHelpers";
import AuthBrandPanel from "@/features/auth/AuthBrandPanel/AuthBrandPanel";
import OtpInput from "@/features/auth/ForgotPasswordPage/OtpInput";
import styles from "@/features/auth/ForgotPasswordPage/ForgotPasswordPage.module.css";

const RESEND_SECONDS = 60;

function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { user, isAuthenticated, isBootstrapping, markEmailVerified, logout } = useAuth();

  const email = (location.state?.email ?? user?.email ?? "").trim();
  const redirectTo = location.state?.from || "/home";
  const postVerifyPath = getRoleHomePath(user, redirectTo);

  const [otp, setOtp] = useState("");
  const [resendSeconds, setResendSeconds] = useState(RESEND_SECONDS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }

    if (isAuthenticated && user?.emailConfirmed !== false) {
      navigate(postVerifyPath, { replace: true });
    }
  }, [isBootstrapping, isAuthenticated, user?.emailConfirmed, navigate, postVerifyPath]);

  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setResendSeconds((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  async function handleVerify(event) {
    event.preventDefault();

    if (!email) {
      showToast("Không tìm thấy email. Vui lòng đăng nhập hoặc đăng ký lại.");
      navigate("/login", { replace: true });
      return;
    }

    if (otp.length !== 6) {
      showToast("Vui lòng nhập đủ 6 chữ số OTP.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.verifyEmail({ email, code: otp });
      if (isAuthenticated) {
        markEmailVerified();
      }
      showToast("Xác minh email thành công.");
      navigate(isAuthenticated ? postVerifyPath : "/login", {
        replace: true,
        state: isAuthenticated ? undefined : { email },
      });
    } catch (error) {
      showToast(error?.message ?? "Mã OTP không hợp lệ.");
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (resendSeconds > 0 || !email) {
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.sendEmailVerification({ email });
      setResendSeconds(RESEND_SECONDS);
      showToast("Mã xác minh đã được gửi. Kiểm tra hộp thư (và thư rác).");
    } catch (error) {
      showToast(error?.message ?? "Không gửi lại được mã OTP.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUseAnotherAccount() {
    if (isAuthenticated) {
      await logout();
    }
    navigate("/login", { replace: true });
  }

  if (isBootstrapping) {
    return null;
  }

  if (!email) {
    return (
      <div className={styles.page}>
        <AuthBrandPanel variant="verify-email" />
        <section className={styles.formSection} aria-labelledby="verify-email-missing-title">
          <div className={styles.formMain}>
            <div className={`${styles.formWrap} ${styles["form-wrap-compact"]}`}>
              <header className={styles.header}>
                <h1 id="verify-email-missing-title" className={styles.title}>
                  Xác minh email
                </h1>
                <p className={styles.subtitle}>
                  Không tìm thấy địa chỉ email. Vui lòng đăng nhập hoặc đăng ký để tiếp tục.
                </p>
              </header>
              <div className={styles.actions}>
                <Link to="/login" className={styles["submit-btn"]}>
                  Đăng nhập
                  <FontAwesomeIcon icon={faArrowRight} className={styles["submit-icon"]} />
                </Link>
                <Link to="/register" className={styles["back-link"]}>
                  Tạo tài khoản mới
                </Link>
              </div>
            </div>
          </div>
          <p className={styles.tagline}>EMPOWERING STUDENTS GLOBALLY</p>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <AuthBrandPanel variant="verify-email" />

      <section className={styles.formSection} aria-labelledby="verify-email-title">
        <div className={styles.formMain}>
          <div className={`${styles.formWrap} ${styles["form-wrap-compact"]}`}>
            <header className={styles["otp-header"]}>
              <h1 id="verify-email-title" className={styles.title}>
                Xác minh email
              </h1>
              <p className={styles.subtitle}>
                Mã xác minh gồm 6 chữ số đã được gửi tới{" "}
                <strong>{email}</strong>. Nhập mã bên dưới để kích hoạt tài khoản.
              </p>
            </header>

            <form className={styles["otp-form"]} onSubmit={handleVerify}>
              <OtpInput value={otp} onChange={setOtp} disabled={isSubmitting} />

              <div className={styles["otp-actions"]}>
                <button
                  type="submit"
                  className={styles["submit-btn"]}
                  disabled={otp.length !== 6 || isSubmitting}
                >
                  Xác minh
                  <FontAwesomeIcon icon={faArrowRight} className={styles["submit-icon"]} />
                </button>

                <div className={styles["resend-row"]}>
                  {resendSeconds > 0 ? (
                    <p className={styles["resend-timer"]}>
                      <FontAwesomeIcon icon={faClock} className={styles["resend-icon"]} />
                      Gửi lại mã sau{" "}
                      <span className={styles["resend-count"]}>{resendSeconds}</span> s
                    </p>
                  ) : (
                    <button
                      type="button"
                      className={styles["resend-btn"]}
                      onClick={handleResend}
                      disabled={isSubmitting}
                    >
                      <FontAwesomeIcon icon={faClock} className={styles["resend-icon"]} />
                      Gửi lại mã
                    </button>
                  )}

                  <button
                    type="button"
                    className={styles["otp-back-btn"]}
                    onClick={handleUseAnotherAccount}
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className={styles["back-icon"]} />
                    Dùng tài khoản khác
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <p className={styles.tagline}>EMPOWERING STUDENTS GLOBALLY</p>
      </section>
    </div>
  );
}

export default VerifyEmailPage;
