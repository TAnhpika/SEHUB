import { REASON_META } from "@/features/moderator/reports/reportsData";
import styles from "./ReasonTag.module.css";

export default function ReasonTag({ reason }) {
  const meta = REASON_META[reason] ?? { label: reason, tone: "muted" };
  return (
    <span
      className={`${styles.tag} ${
        meta.tone === "danger" ? styles.tagDanger : styles.tagMuted
      }`}
    >
      {meta.label}
    </span>
  );
}
