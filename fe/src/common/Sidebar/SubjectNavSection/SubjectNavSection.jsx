/**
 * @fileoverview Section sidebar hiển thị điều hướng theo nhóm môn học, có phân nhánh theo scope và quyền Premium.
 *
 * @module common/Sidebar/SubjectNavSection
 */

import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faCircleQuestion,
  faClockRotateLeft,
  faFileLines,
} from "@fortawesome/free-solid-svg-icons";
import { getSubjectNavLinks } from "@/utils/subjectPaths";

const SUBJECT_ICONS = {
  review: faCircleQuestion,
  practice: faBook,
  documents: faFileLines,
  history: faClockRotateLeft,
};

/**
 * @typedef {Object} SubjectNavSectionProps
 * @property {string} pathname - Pathname hiện tại để xác định item active.
 * @property {Record<string, string>} styles - CSS module từ sidebar cha.
 * @property {"community" | "home"} [scope="community"] - Không gian route cần build link.
 * @property {() => void} [onNavigate] - Callback đóng drawer/menu sau khi click điều hướng.
 * @property {boolean} [isPremium=false] - Quyền Premium hiện tại để mở thêm link cần trả phí.
 */

/**
 * Khối điều hướng môn học dùng chung cho sidebar `community` và `home`.
 *
 * Danh sách link được sinh qua `getSubjectNavLinks(scope, { isPremium })`
 * để giữ luật hiển thị Premium nhất quán ở mọi khu vực.
 *
 * @param {SubjectNavSectionProps} props - Props điều khiển section điều hướng.
 * @returns {import('react').ReactElement} Danh sách link môn học kèm trạng thái active.
 *
 * @example
 * <SubjectNavSection
 *   pathname={pathname}
 *   styles={styles}
 *   scope="home"
 *   isPremium={isPremium}
 * />
 */
function SubjectNavSection({
  pathname,
  styles,
  scope = "community",
  onNavigate,
  isPremium = false,
}) {
  const links = getSubjectNavLinks(scope, { isPremium }).map((item) => ({
    ...item,
    icon: SUBJECT_ICONS[item.key],
  }));

  return (
    <>
      <div className={styles.divider} aria-hidden="true" />

      <div className={styles.section}>
        <p className={styles["section-title"]}>Môn học</p>
        <ul className={styles.list}>
          {links.map((item) => {
            const isActive =
              pathname === item.to || pathname.startsWith(`${item.to}/`);

            return (
              <li key={item.key}>
                <Link
                  to={item.to}
                  className={`${styles["subject-link"]} ${isActive ? styles.active : ""}`}
                  onClick={onNavigate}
                >
                  <FontAwesomeIcon icon={item.icon} className={styles.icon} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

export default SubjectNavSection;
