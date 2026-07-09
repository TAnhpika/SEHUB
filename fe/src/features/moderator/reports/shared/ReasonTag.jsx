/**
 * @fileoverview Component hiển thị thẻ lý do báo cáo với màu theo mức độ nghiêm trọng.
 *
 * @module features/moderator/reports/shared/ReasonTag
 */

import { REASON_META } from "@/features/moderator/reports/reportsData";
import styles from "./ReasonTag.module.css";

/**
 * @typedef {Object} ReasonTagProps
 * @property {string} reason - Khóa lý do báo cáo; tra cứu trong `REASON_META`.
 */

/**
 * Hiển thị nhãn lý do báo cáo dạng thẻ màu (`danger` hoặc `muted`).
 *
 * @param {ReasonTagProps} props - Props của component.
 * @returns {import('react').ReactElement} Thẻ `<span>` chứa nhãn lý do.
 *
 * @example
 * <ReasonTag reason="spam" />
 * // => <span class="tag tagDanger">Spam</span>
 */
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
