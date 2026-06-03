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

function ForgotPasswordPage() {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [method, setMethod] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  function handleContinue(event) {
    event.preventDefault();

    if (!method) {
      showToast("Vui lòng chọn phương thức nhận mã xác minh.");
      return;
    }

    setIsSubmitting(true);

    const channel = method === "email" ? "email" : "SMS";
    showToast(`Mã xác minh đã được gửi qua ${channel}. (Mock — bước OTP sẽ được triển khai tiếp.)`);
    setIsSubmitting(false);
  }

  return (
    <div className={styles.page}>
      <AuthBrandPanel variant="forgot-password" />

      <section className={styles.formSection} aria-labelledby="forgot-password-title">
        <div className={styles.formWrap}>
          <header className={styles.header}>
            <h1 id="forgot-password-title" className={styles.title}>
              Quên mật khẩu?
            </h1>
            <p className={styles.subtitle}>
              Chọn phương thức bạn muốn sử dụng để nhận mã xác minh.
            </p>
          </header>

          <form className={styles.form} onSubmit={handleContinue}>
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
        </div>
      </section>
    </div>
  );
}

export default ForgotPasswordPage;
