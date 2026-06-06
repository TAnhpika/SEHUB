import styles from "./SubjectCatalogFilters.module.css";

/**
 * @param {{
 *   semester: string;
 *   major: string;
 *   semesterOptions: { value: string; label: string }[];
 *   majorOptions: { value: string; label: string }[];
 *   onSemesterChange: (value: string) => void;
 *   onMajorChange: (value: string) => void;
 *   className?: string;
 * }} props
 */
function SubjectCatalogFilters({
  semester,
  major,
  semesterOptions,
  majorOptions,
  onSemesterChange,
  onMajorChange,
  className = "",
}) {
  return (
    <div className={`${styles.shell} ${className}`.trim()}>
      <div className={styles.row}>
        <span className={styles.label} id="catalog-filter-semester-label">
          Học kỳ
        </span>
        <div
          className={styles.track}
          role="group"
          aria-labelledby="catalog-filter-semester-label"
        >
          {semesterOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.pill} ${semester === opt.value ? styles.pillActive : ""}`}
              aria-pressed={semester === opt.value}
              onClick={() => onSemesterChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.row}>
        <span className={styles.label} id="catalog-filter-major-label">
          Khối ngành
        </span>
        <div
          className={styles.track}
          role="group"
          aria-labelledby="catalog-filter-major-label"
        >
          {majorOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.pill} ${major === opt.value ? styles.pillActive : ""}`}
              aria-pressed={major === opt.value}
              onClick={() => onMajorChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SubjectCatalogFilters;
