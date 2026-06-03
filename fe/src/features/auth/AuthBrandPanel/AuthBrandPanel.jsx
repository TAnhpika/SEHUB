import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileLines,
  faFire,
  faRobot,
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

function AuthBrandPanel() {
  return (
    <aside className={styles.panel} aria-label="Giới thiệu SEHub">
      <div className={styles["glow-top"]} aria-hidden="true" />
      <div className={styles["glow-bottom"]} aria-hidden="true" />

      <Link to="/" className={styles.brand}>
        <span className={styles["logo-wrap"]}>
          <img src={logoSrc} alt="" className={styles.logo} decoding="async" aria-hidden="true" />
        </span>
        <span className={styles["brand-name"]}>SEHub</span>
      </Link>

      <div className={styles.intro}>
        <h2 className={styles.headline}>
          Chào mừng bạn
          <br />
          quay trở lại!
        </h2>
        <span className={styles.divider} aria-hidden="true" />
        <p className={styles.desc}>
          Tạo tài khoản để khám phá kho đề thi khổng lồ và kết nối với cộng đồng sinh viên FPT
          thông minh.
        </p>
      </div>

      <ul className={styles.features}>
        {FEATURES.map((item) => (
          <li key={item.title} className={styles["feature-card"]}>
            <span className={styles["feature-icon"]}>
              <FontAwesomeIcon icon={item.icon} />
            </span>
            <div className={styles["feature-copy"]}>
              <h3 className={styles["feature-title"]}>{item.title}</h3>
              <p className={styles["feature-desc"]}>{item.desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default AuthBrandPanel;
