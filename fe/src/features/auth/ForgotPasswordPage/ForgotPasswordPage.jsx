import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faChevronRight,
  faEnvelope,
  faMobileScreenButton,
} from "@fortawesome/free-solid-svg-icons";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context/AuthContext";
import AuthBrandPanel from "@/features/auth/AuthBrandPanel/AuthBrandPanel";
import styles from "./ForgotPasswordPage.module.css";

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

function ForgotPasswordPage() {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState("method");
  const [method, setMethod] = useState(null);
  const [contact, setContact] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    const channel = method === "email" ? "email" : "SMS";
    showToast(`Mã xác minh 6 chữ số đã được gửi qua ${channel}. (Mock — bước OTP sẽ được triển khai tiếp.)`);
    setIsSubmitting(false);
  }

  function handleChangeMethod() {
    setContact("");
    setStep("method");
  }

  const contactCopy = method ? CONTACT_COPY[method] : null;
  const activeStep = step === "contact" && method ? "contact" : "method";

  return (
    <div className={styles.page}>
      <AuthBrandPanel variant="forgot-password" />

      <section
        className={styles.formSection}
        aria-labelledby={activeStep === "method" ? "forgot-password-title" : "forgot-password-contact-title"}
      >
        <div className={activeStep === "contact" ? `${styles.formWrap} ${styles["form-wrap-compact"]}` : styles.formWrap}>
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
          ) : (
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
          )}
        </div>
      </section>
    </div>
  );
}

export default ForgotPasswordPage;
