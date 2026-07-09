import styles from "./TrustScoreBadge.module.css";

const TIER_LABEL = {
  high: "Tin cậy cao",
  medium: "Trung bình",
  low: "Cần lưu ý",
};

function resolveTierClass(tier) {
  if (tier === "high") return styles.tierHigh;
  if (tier === "low") return styles.tierLow;
  return styles.tierMid;
}

function resolveFillClass(tier) {
  if (tier === "high") return styles.fillHigh;
  if (tier === "low") return styles.fillLow;
  return styles.fillMid;
}

/**
 * @param {{ score?: number | null, tier?: string | null, variant?: 'public' | 'staff', className?: string }} props
 */
function TrustScoreBadge({ score = 0, tier = "medium", variant = "public", className = "" }) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  const safeTier = tier ?? "medium";
  const tierLabel = TIER_LABEL[safeTier] ?? TIER_LABEL.medium;

  return (
    <div className={`${styles.wrap} ${className}`.trim()} aria-label={`Điểm tin cậy ${safeScore}, ${tierLabel}`}>
      <div className={styles.header}>
        <span className={styles.title}>Điểm tin cậy</span>
        <span className={`${styles.value} ${resolveTierClass(safeTier)}`}>{safeScore}</span>
      </div>
      <div className={styles.track} aria-hidden>
        <span className={`${styles.fill} ${resolveFillClass(safeTier)}`} style={{ width: `${safeScore}%` }} />
      </div>
      <p className={styles.caption}>{tierLabel}</p>
      {variant === "staff" ? (
        <p className={styles.staffHint}>Chỉ Admin/Mod thấy chi tiết hành vi nội bộ.</p>
      ) : null}
    </div>
  );
}

export default TrustScoreBadge;
