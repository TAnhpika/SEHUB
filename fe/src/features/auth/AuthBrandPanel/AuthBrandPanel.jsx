import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
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

const FORGOT_FEATURES = [
  {
    icon: faShieldHalved,
    title: "BẢO MẬT ĐA LỚP",
    desc: "Quy trình xác minh nghiêm ngặt đảm bảo chỉ bạn mới có thể truy cập lại tài khoản.",
    uppercase: true,
  },
  {
    icon: faHeadset,
    title: "HỖ TRỢ 24/7",
    desc: "Đội ngũ kỹ thuật luôn sẵn sàng nếu bạn gặp bất kỳ trở ngại nào trong quá trình khôi phục.",
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
    desc: "Tạo tài khoản để khám phá kho đề thi khổng lồ và kết nối với cộng đồng sinh viên FPT thông minh.",
    features: FEATURES,
    showDivider: true,
  },
  register: {
    headline: (
      <>
        Bắt đầu hành trình
        <br />
        của bạn!
      </>
    ),
    desc: "Tạo tài khoản để khám phá kho đề thi khổng lồ và kết nối với cộng đồng sinh viên FPT thông minh.",
    features: FEATURES,
    showDivider: true,
  },
  "forgot-password": {
    headline: "Khôi phục mật khẩu",
    desc: "Đừng lo lắng, chúng tôi sẽ giúp bạn lấy lại quyền truy cập vào tài khoản SEHub của mình thông qua quy trình xác minh an toàn.",
    features: FORGOT_FEATURES,
    showDivider: false,
    showFooter: true,
  },
};

/**
 * @param {{ variant?: "login" | "register" | "forgot-password" }} props
 */
function AuthBrandPanel({ variant = "login" }) {
  const copy = PANEL_COPY[variant] ?? PANEL_COPY.login;
  const panelClassName =
    variant === "forgot-password" ? `${styles.panel} ${styles["panel-spread"]}` : styles.panel;

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
        <p className={styles["panel-footer"]}>© 2024 SEHub AI Platform</p>
      ) : null}
    </aside>
  );
}

export default AuthBrandPanel;
