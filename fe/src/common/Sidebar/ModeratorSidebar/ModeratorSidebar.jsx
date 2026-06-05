import { Link, NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "@/context";
import { MODERATOR_NAV_ITEMS } from "@/features/moderator/moderatorNavData";
import styles from "./ModeratorSidebar.module.css";

function ModeratorSidebar() {
  const { user, isAdmin } = useAuth();
  const displayName = user?.displayName ?? "Admin User";
  const roleLabel =
    user?.roleLabel ??
    (user?.role === "admin" ? "Quản trị viên" : "Kiểm duyệt viên");

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

      {isAdmin ? (
        <Link to="/admin" className={styles.adminLink}>
          → Khu vực Admin
        </Link>
      ) : null}

      <div className={styles.profile}>
        <div className={styles.avatar} aria-hidden>
          {user?.initial ?? "A"}
        </div>
        <div>
          <p className={styles.name}>{displayName}</p>
          <p className={styles.role}>{roleLabel}</p>
        </div>
      </div>
    </aside>
  );
}

export default ModeratorSidebar;
