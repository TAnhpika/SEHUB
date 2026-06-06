import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faBell,
  faGear,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import ModeratorBreadcrumb from "@/common/Breadcrumb/ModeratorBreadcrumb/ModeratorBreadcrumb";
import { useAuth } from "@/context";
import { useModeratorPage } from "@/features/moderator/context/ModeratorPageContext";
import styles from "./ModeratorHeader.module.css";

const TOP_LINKS = [
  { label: "Trang chủ", to: "/home" },
  { label: "Báo cáo", to: "/moderator/reports" },
  { label: "Thêm đề TH", to: "/moderator/practice-exams/add" },
];

function ModeratorHeader() {
  const { user } = useAuth();
  const { pageMeta, setSidebarOpen } = useModeratorPage();
  const displayName = user?.displayName ?? "Moderator";
  const unread = user?.unreadNotifications ?? 0;

  return (
    <header className={styles.header}>
      <div className={styles.leading}>
        <button
          type="button"
          className={styles.menuBtn}
          aria-label="Mở menu"
          onClick={() => setSidebarOpen(true)}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>

        <div className={styles.search}>
          <FontAwesomeIcon icon={faMagnifyingGlass} className={styles.searchIcon} />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Tìm kiếm nội dung..."
            aria-label="Tìm kiếm"
          />
        </div>
      </div>

      <div className={styles.center}>
        <ModeratorBreadcrumb crumbs={pageMeta.crumbs} />
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.iconBtn} aria-label="Thông báo">
          <FontAwesomeIcon icon={faBell} />
          {unread > 0 ? <span className={styles.badge} aria-hidden /> : null}
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Cài đặt">
          <FontAwesomeIcon icon={faGear} />
        </button>
        <div className={styles.avatar} title={displayName} aria-hidden>
          {user?.initial ?? "M"}
        </div>
      </div>
    </header>
  );
}

export default ModeratorHeader;
