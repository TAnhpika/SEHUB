import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAward,
  faCommentDots,
  faHome,
  faUserGroup,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import SubjectNavSection from "@/common/Sidebar/SubjectNavSection/SubjectNavSection";
import PricingModal from "@/features/landing/PricingModal/PricingModal";
import styles from "./MainSidebar.module.css";

const MAIN_LINKS = [
  { to: "/home", label: "Trang chủ", icon: faHome, end: true },
  { to: "/home/friends", label: "Tìm kiếm bạn bè", icon: faUserGroup },
];

function MainSidebar() {
  const { pathname } = useLocation();
  const [pricingOpen, setPricingOpen] = useState(false);

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar} aria-label="Điều hướng chính">
        <div className={styles.panel}>
          <nav className={styles.nav}>
            {MAIN_LINKS.map((item) => {
              const isActive = item.end ? pathname === item.to : pathname.startsWith(item.to);

              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`${styles.link} ${isActive ? styles.active : ""}`}
                >
                  <FontAwesomeIcon icon={item.icon} className={styles.icon} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <SubjectNavSection pathname={pathname} styles={styles} />

          <div className={styles.premium}>
            <div className={styles["premium-header"]}>
              <span className={styles["premium-icon"]} aria-hidden="true">
                <FontAwesomeIcon icon={faAward} />
              </span>
              <p className={styles["premium-title"]}>Nâng cấp Premium</p>
            </div>
            <p className={styles["premium-desc"]}>
              Xem full đáp án, tài liệu, AI không giới hạn
            </p>
            <Button
              size="sm"
              fullWidth
              className={styles["premium-btn"]}
              onClick={() => setPricingOpen(true)}
            >
              Xem gói ngay
            </Button>
          </div>

          <Link to="/home/feedback" className={styles.feedback}>
            <FontAwesomeIcon icon={faCommentDots} className={styles.icon} />
            Gửi phản hồi
          </Link>
        </div>
      </aside>

      <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
    </div>
  );
}

export default MainSidebar;
