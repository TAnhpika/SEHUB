import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCommentDots,
  faHome,
  faUserGroup,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import SubjectNavSection from "@/common/Sidebar/SubjectNavSection/SubjectNavSection";
import styles from "./MainSidebar.module.css";

const MAIN_LINKS = [
  { to: "/home", label: "Trang chủ", icon: faHome, end: true },
  { to: "/home/friends", label: "Tìm kiếm bạn bè", icon: faUserGroup },
];

function MainSidebar() {
  const { pathname } = useLocation();

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

          <div className={styles.discord}>
            <p className={styles["discord-title"]}>Cộng đồng Discord</p>
            <p className={styles["discord-desc"]}>
              Tham gia server Discord để thảo luận, hỏi đáp và cập nhật tin tức mới nhất.
            </p>
            <Button size="sm" fullWidth className={styles["discord-btn"]}>
              Nhấn vào đây để tham gia
            </Button>
          </div>

          <Link to="/support#contact" className={styles.feedback}>
            <FontAwesomeIcon icon={faCommentDots} className={styles.icon} />
            Gửi phản hồi
          </Link>
        </div>
      </aside>
    </div>
  );
}

export default MainSidebar;
