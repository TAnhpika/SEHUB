import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBolt,
  faFileLines,
  faFire,
  faHeadset,
  faRobot,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import logoSrc from "@/img/logo.png";
import styles from "./AuthBrandPanel.module.css";

const FEATURES = [
  {
    icon: faFileLines,
    title: "Kho 500+ đề thi",
    desc: "Cập nhật mỗi ngày từ các trường Top.",
  },
  {
    icon: faRobot,
    title: "AI giải đáp",
    desc: "Hỗ trợ 24/7 thông minh, chính xác tức thì.",
  },
  {
    icon: faFire,
    title: "Tích điểm streak",
    desc: "Duy trì thói quen học tập để nhận quà.",
  },
];

const RECOVERY_STEPS = [
  "Chọn Email hoặc SMS",
  "Nhập liên hệ đã đăng ký",
  "Xác nhận mã OTP 6 số",
  "Đặt mật khẩu mới",
];

const FORGOT_FEATURES = [
  {
    icon: faShieldHalved,
    title: "BẢO MẬT ĐA LỚP",
    desc: "Xác minh nghiêm ngặt — chỉ bạn truy cập lại được tài khoản.",
    uppercase: true,
  },
  {
    icon: faBolt,
    title: "NHANH CHÓNG",
    desc: "Mã OTP gửi trong vài phút, hiệu lực ngắn để bảo vệ tài khoản.",
    uppercase: true,
  },
  {
    icon: faHeadset,
    title: "HỖ TRỢ 24/7",
    desc: "Đội ngũ sẵn sàng hỗ trợ nếu bạn gặp trở ngại khi khôi phục.",
    uppercase: true,
  },
];

const PANEL_COPY = {
  login: {
    headline: (
      <>
        Chào mừng bạn
        <br />
        quay trở lại!
      </>
    ),
    desc: "Đăng nhập để tiếp tục khám phá kho đề thi, tài liệu và kết nối với cộng đồng sinh viên FPT.",
    features: FEATURES,
    showDivider: true,
  },
  register: {
    headline: (
      <>
        Bắt đầu
        <br />
        hành trình của bạn!
      </>
    ),
    desc: "Tạo tài khoản để khám phá kho đề thi khổng lồ và kết nối với cộng đồng sinh viên FPT thông minh.",
    features: FEATURES,
    showDivider: true,
  },
  "forgot-password": {
    headline: "Khôi phục mật khẩu",
    desc: "Lấy lại quyền truy cập SEHub qua xác minh Email hoặc SMS — an toàn và nhanh chóng.",
    steps: RECOVERY_STEPS,
    stepsTitle: "Quy trình khôi phục",
    features: FORGOT_FEATURES,
    showDivider: false,
    showFooter: true,
  },
  "verify-email": {
    headline: (
      <>
        Xác minh
        <br />
        email của bạn
      </>
    ),
    desc: "Chúng tôi gửi mã OTP 6 chữ số để đảm bảo email thuộc về bạn trước khi sử dụng SEHub.",
    features: FEATURES,
    showDivider: true,
  },
};

/**
 * @param {{ variant?: "login" | "register" | "forgot-password" | "verify-email" }} props
 */
function AuthBrandPanel({ variant = "login" }) {
  const copy = PANEL_COPY[variant] ?? PANEL_COPY.login;
  const panelClassName = [
    styles.panel,
    variant === "forgot-password" && styles["panel-spread"],
    variant === "register" && styles["panel-compact"],
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <aside className={panelClassName} aria-label="Giới thiệu SEHub">
      <div className={styles["glow-top"]} aria-hidden="true" />
      <div className={styles["glow-bottom"]} aria-hidden="true" />

      <Link to="/" className={styles.brand}>
        <span className={styles["logo-wrap"]}>
          <img src={logoSrc} alt="" className={styles.logo} decoding="async" aria-hidden="true" />
        </span>
        <span className={styles["brand-name"]}>SEHub</span>
      </Link>

      <div className={styles.content}>
        <div className={styles.intro}>
          <h2 className={styles.headline}>{copy.headline}</h2>
          {copy.showDivider ? <span className={styles.divider} aria-hidden="true" /> : null}
          <p className={styles.desc}>{copy.desc}</p>
        </div>

        {copy.steps?.length ? (
          <div className={styles["steps-block"]}>
            <p className={styles["steps-label"]}>{copy.stepsTitle}</p>
            <ol className={styles.steps}>
              {copy.steps.map((step, index) => (
                <li key={step} className={styles["step-item"]}>
                  <span className={styles["step-num"]} aria-hidden="true">
                    {index + 1}
                  </span>
                  <span className={styles["step-text"]}>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        <ul className={styles.features}>
          {copy.features.map((item) => (
            <li key={item.title} className={styles["feature-card"]}>
              <span className={styles["feature-icon"]}>
                <FontAwesomeIcon icon={item.icon} />
              </span>
              <div className={styles["feature-copy"]}>
                <h3
                  className={
                    item.uppercase
                      ? `${styles["feature-title"]} ${styles["feature-title-upper"]}`
                      : styles["feature-title"]
                  }
                >
                  {item.title}
                </h3>
                <p className={styles["feature-desc"]}>{item.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {copy.showFooter ? (
        <p className={styles["panel-footer"]}>© 2026 SEHub AI Platform</p>
      ) : null}
    </aside>
  );
}

export default AuthBrandPanel;
