import { NavLink, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context";
import { MODERATOR_NAV_ITEMS } from "@/features/moderator/moderatorNavData";
import styles from "./ModeratorSidebar.module.css";

function ModeratorSidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const displayName = user?.displayName ?? "Admin User";

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <h1 className={styles.logo}>
          <span>SEHub</span>
          <span>Moderator</span>
        </h1>
        <p className={styles.tagline}>Hệ thống kiểm duyệt</p>
      </div>

      <nav className={styles.nav} aria-label="Điều hướng kiểm duyệt">
        {MODERATOR_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles["link-active"] : ""}`
            }
          >
            <FontAwesomeIcon icon={item.icon} className={styles.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.profile}>
          <div className={styles.avatar} aria-hidden>
            {user?.initial ?? "A"}
          </div>
          <div>
            <p className={styles.name}>{displayName}</p>
            <p className={styles.email}>{user?.email ?? "admin@sehub.edu.vn"}</p>
          </div>
        </div>
        <button
          type="button"
          className={styles.logout}
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          <FontAwesomeIcon icon={faRightFromBracket} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}

export default ModeratorSidebar;
