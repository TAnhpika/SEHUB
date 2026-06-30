import { Link } from "react-router-dom";
import styles from "./Button.module.css";

const LOOK_CLASS = {
  solid: styles.solid,
  outline: styles.outline,
  soft: styles.soft,
};

const SIZE_CLASS = {
  sm: styles.sm,
  md: "",
  lg: styles.lg,
};

function Button({
  children,
  look = "solid",
  size = "md",
  fullWidth = false,
  to,
  type = "button",
  disabled = false,
  loading = false,
  loadingLabel,
  onClick,
  className = "",
}) {
  const classes = [
    styles.btn,
    LOOK_CLASS[look],
    SIZE_CLASS[size],
    fullWidth && styles.full,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (to) {
    return (
      <Link className={classes} to={to}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled || loading} onClick={onClick}>
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}

export default Button;
