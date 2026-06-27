import styles from "./UserAvatar.module.css";

function UserAvatar({
  src,
  initial,
  alt = "",
  size = "md",
  className,
}) {
  const sizeClass = styles[size] ?? styles.md;
  const displayInitial = initial?.charAt(0)?.toUpperCase() ?? "?";

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={[styles.avatar, sizeClass, className].filter(Boolean).join(" ")}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <span
      className={[styles.avatar, styles.placeholder, sizeClass, className].filter(Boolean).join(" ")}
      aria-hidden={alt ? undefined : true}
    >
      {displayInitial}
    </span>
  );
}

export default UserAvatar;
