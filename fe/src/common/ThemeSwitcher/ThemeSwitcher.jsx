import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDesktop, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "@/hooks/useTheme";
import styles from "./ThemeSwitcher.module.css";

const OPTIONS = [
  { id: "light", label: "Sáng", icon: faSun },
  { id: "dark", label: "Tối", icon: faMoon },
  { id: "system", label: "Hệ thống", icon: faDesktop },
];

/**
 * @param {{ variant?: "compact" | "menu"; className?: string }} props
 */
function ThemeSwitcher({ variant = "compact", className = "" }) {
  const { theme, setTheme } = useTheme();

  if (variant === "menu") {
    return (
      <div className={`${styles.menuBlock} ${className}`.trim()} role="presentation">
        <p className={styles.menuLabel}>Giao diện</p>
        <div className={styles.menuGroup} role="radiogroup" aria-label="Chọn giao diện">
          {OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={theme === option.id}
              className={`${styles.menuOption} ${theme === option.id ? styles.menuOptionActive : ""}`.trim()}
              onClick={() => setTheme(option.id)}
            >
              <FontAwesomeIcon icon={option.icon} className={styles.menuOptionIcon} />
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.compact} ${className}`.trim()}
      role="radiogroup"
      aria-label="Chọn giao diện"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={theme === option.id}
          aria-label={option.label}
          title={option.label}
          className={`${styles.compactBtn} ${theme === option.id ? styles.compactBtnActive : ""}`.trim()}
          onClick={() => setTheme(option.id)}
        >
          <FontAwesomeIcon icon={option.icon} />
        </button>
      ))}
    </div>
  );
}

export default ThemeSwitcher;
