import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faChevronRight,
  faClock,
  faEnvelope,
  faMobileScreenButton,
} from "@fortawesome/free-solid-svg-icons";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context/AuthContext";
import AuthBrandPanel from "@/features/auth/AuthBrandPanel/AuthBrandPanel";
import OtpInput from "@/features/auth/ForgotPasswordPage/OtpInput";
import styles from "./ForgotPasswordPage.module.css";

const RESEND_SECONDS = 60;

const METHODS = [
  {
    id: "email",
    title: "Qua Email",
    desc: "Gửi mã xác nhận tới email của bạn",
    icon: faEnvelope,
  },
  {
    id: "phone",
    title: "Qua Số điện thoại",
    desc: "Gửi mã xác nhận qua tin nhắn SMS",
    icon: faMobileScreenButton,
  },
];

const CONTACT_COPY = {
  email: {
    title: "Nhập Email của bạn",
    subtitle:
      "Chúng tôi sẽ gửi mã xác minh gồm 6 chữ số đến email này để xác thực tài khoản của bạn.",
    label: "Địa chỉ Email",
    placeholder: "example@email.com",
    icon: faEnvelope,
    inputType: "email",
    autoComplete: "email",
  },
  phone: {
    title: "Nhập Số điện thoại của bạn",
    subtitle:
      "Chúng tôi sẽ gửi mã xác minh gồm 6 chữ số qua tin nhắn SMS đến số này để xác thực tài khoản của bạn.",
    label: "Số điện thoại",
    placeholder: "0912345678",
    icon: faMobileScreenButton,
    inputType: "tel",
    autoComplete: "tel",
  },
};

const OTP_COPY = {
  email:
    "Mã xác thực đã được gửi đến email của bạn. Vui lòng kiểm tra và nhập mã gồm 6 chữ số bên dưới.",
  phone:
    "Mã xác thực đã được gửi đến số điện thoại của bạn. Vui lòng kiểm tra tin nhắn SMS và nhập mã gồm 6 chữ số bên dưới.",
};

function ForgotPasswordPage() {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState("method");
  const [method, setMethod] = useState(null);
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [resendSeconds, setResendSeconds] = useState(RESEND_SECONDS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeStep =
    step === "otp" && method && contact
      ? "otp"
      : step === "contact" && method
        ? "contact"
        : "method";

  useEffect(() => {
    if (activeStep !== "otp") {
      return;
    }

    setResendSeconds(RESEND_SECONDS);
  }, [activeStep, contact]);

  useEffect(() => {
    if (activeStep !== "otp" || resendSeconds <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setResendSeconds((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [activeStep, resendSeconds]);

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  function handleSelectMethod(event) {
    event.preventDefault();

    if (!method) {
      showToast("Vui lòng chọn phương thức nhận mã xác minh.");
      return;
    }

    setStep("contact");
  }

  function handleSendOtp(event) {
    event.preventDefault();

    const value = contact.trim();
    if (!value) {
      showToast(method === "email" ? "Vui lòng nhập email." : "Vui lòng nhập số điện thoại.");
      return;
    }

    if (method === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      showToast("Email không hợp lệ.");
      return;
    }

    if (method === "phone" && !/^0\d{9,10}$/.test(value.replace(/\s/g, ""))) {
      showToast("Số điện thoại không hợp lệ.");
      return;
    }

    setIsSubmitting(true);
    setOtp("");
    setStep("otp");
    setIsSubmitting(false);
  }

  function handleVerifyOtp(event) {
    event.preventDefault();

    if (otp.length !== 6) {
      showToast("Vui lòng nhập đủ 6 chữ số OTP.");
      return;
    }

    setIsSubmitting(true);
    showToast("Xác minh OTP thành công. (Mock — bước đặt lại mật khẩu sẽ được triển khai tiếp.)");
    setIsSubmitting(false);
  }

  function handleResendOtp() {
    if (resendSeconds > 0) {
      return;
    }

    setOtp("");
    setResendSeconds(RESEND_SECONDS);
    const channel = method === "email" ? "email" : "SMS";
    showToast(`Mã xác minh mới đã được gửi qua ${channel}. (Mock)`);
  }

  function handleChangeMethod() {
    setContact("");
    setOtp("");
    setStep("method");
  }

  function handleBackFromOtp() {
    setOtp("");
    setStep("contact");
  }

  const contactCopy = method ? CONTACT_COPY[method] : null;
  const otpSubtitle = method ? OTP_COPY[method] : "";

  const formWrapClassName =
    activeStep === "contact"
      ? `${styles.formWrap} ${styles["form-wrap-compact"]}`
      : styles.formWrap;

  const sectionLabelId =
    activeStep === "method"
      ? "forgot-password-title"
      : activeStep === "contact"
        ? "forgot-password-contact-title"
        : "forgot-password-otp-title";

  return (
    <div className={styles.page}>
      <AuthBrandPanel variant="forgot-password" />

      <section className={styles.formSection} aria-labelledby={sectionLabelId}>
        <div className={formWrapClassName}>
          {activeStep === "method" ? (
            <>
              <header className={styles.header}>
                <h1 id="forgot-password-title" className={styles.title}>
                  Quên mật khẩu?
                </h1>
                <p className={styles.subtitle}>
                  Chọn phương thức bạn muốn sử dụng để nhận mã xác minh.
                </p>
              </header>

              <form className={styles.form} onSubmit={handleSelectMethod}>
                <div className={styles.options} role="radiogroup" aria-label="Phương thức xác minh">
                  {METHODS.map((item) => {
                    const isSelected = method === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        className={
                          isSelected
                            ? `${styles.option} ${styles["option-selected"]}`
                            : styles.option
                        }
                        onClick={() => setMethod(item.id)}
                      >
                        <span className={styles["option-icon-wrap"]}>
                          <FontAwesomeIcon icon={item.icon} className={styles["option-icon"]} />
                        </span>
                        <span className={styles["option-copy"]}>
                          <span className={styles["option-head"]}>
                            <span className={styles["option-title"]}>{item.title}</span>
                            <FontAwesomeIcon icon={faChevronRight} className={styles["option-chevron"]} />
                          </span>
                          <span className={styles["option-desc"]}>{item.desc}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className={styles.actions}>
                  <button
                    type="submit"
                    className={styles["submit-btn"]}
                    disabled={!method || isSubmitting}
                  >
                    Tiếp tục
                    <FontAwesomeIcon icon={faArrowRight} className={styles["submit-icon"]} />
                  </button>

                  <Link to="/login" className={styles["back-link"]}>
                    <FontAwesomeIcon icon={faArrowLeft} className={styles["back-icon"]} />
                    Quay lại đăng nhập
                  </Link>
                </div>
              </form>

              <footer className={styles.footer}>
                <p>© 2024 SEHub AI. Empowering students globally.</p>
              </footer>
            </>
          ) : null}

          {activeStep === "contact" ? (
            <>
              <header className={styles["contact-header"]}>
                <h1 id="forgot-password-contact-title" className={styles.title}>
                  {contactCopy?.title}
                </h1>
                <p className={styles.subtitle}>{contactCopy?.subtitle}</p>
              </header>

              <form className={styles["contact-form"]} onSubmit={handleSendOtp}>
                <label className={styles.field}>
                  <span className={styles.label}>{contactCopy?.label}</span>
                  <span className={styles["input-wrap"]}>
                    <FontAwesomeIcon icon={contactCopy?.icon} className={styles["input-icon"]} />
                    <input
                      type={contactCopy?.inputType}
                      className={styles.input}
                      value={contact}
                      onChange={(event) => setContact(event.target.value)}
                      placeholder={contactCopy?.placeholder}
                      autoComplete={contactCopy?.autoComplete}
                      required
                    />
                  </span>
                </label>

                <button type="submit" className={styles["send-btn"]} disabled={isSubmitting}>
                  Gửi mã xác minh
                  <FontAwesomeIcon icon={faArrowRight} className={styles["submit-icon"]} />
                </button>
              </form>

              <div className={styles["change-method"]}>
                <button type="button" className={styles["change-method-btn"]} onClick={handleChangeMethod}>
                  <FontAwesomeIcon icon={faArrowLeft} className={styles["back-icon"]} />
                  Thay đổi phương thức xác minh
                </button>
              </div>

              <footer className={styles["assist-footer"]}>
                <p>
                  Gặp sự cố khi nhận mã?{" "}
                  <Link to="/support" className={styles["support-link"]}>
                    Liên hệ hỗ trợ
                  </Link>
                </p>
              </footer>

              <p className={styles["page-tagline"]}>© 2024 SEHub AI. Empowering students globally.</p>
            </>
          ) : null}

          {activeStep === "otp" ? (
            <>
              <header className={styles["otp-header"]}>
                <h1 id="forgot-password-otp-title" className={styles.title}>
                  Xác nhận mã OTP
                </h1>
                <p className={styles.subtitle}>{otpSubtitle}</p>
              </header>

              <form className={styles["otp-form"]} onSubmit={handleVerifyOtp}>
                <OtpInput value={otp} onChange={setOtp} disabled={isSubmitting} />

                <div className={styles["otp-actions"]}>
                  <button
                    type="submit"
                    className={styles["submit-btn"]}
                    disabled={otp.length !== 6 || isSubmitting}
                  >
                    Tiếp tục
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
                      <button type="button" className={styles["resend-btn"]} onClick={handleResendOtp}>
                        <FontAwesomeIcon icon={faClock} className={styles["resend-icon"]} />
                        Gửi lại mã
                      </button>
                    )}

                    <button type="button" className={styles["otp-back-btn"]} onClick={handleBackFromOtp}>
                      <FontAwesomeIcon icon={faArrowLeft} className={styles["back-icon"]} />
                      Quay lại
                    </button>
                  </div>
                </div>
              </form>

              <footer className={styles.footer}>
                <p>© 2024 SEHub AI. Empowering students globally.</p>
              </footer>
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export default ForgotPasswordPage;
