import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import {
  MAJOR_OPTIONS,
  SEMESTER_OPTIONS,
} from "@/features/review/ReviewQuestionsPage/reviewData";
import styles from "./CourseCatalogPage.module.css";

function CourseCatalogPage({ title, subtitle, courses, detailBasePath, showSubjectName = true }) {
  const [searchParams] = useSearchParams();
  const semesterFromUrl = searchParams.get("semester");
  const [semesterFilter, setSemesterFilter] = useState(() =>
    semesterFromUrl && semesterFromUrl !== "all" ? semesterFromUrl : "all",
  );
  const [majorFilter, setMajorFilter] = useState("all");

  useEffect(() => {
    if (semesterFromUrl && semesterFromUrl !== "all") {
      setSemesterFilter(semesterFromUrl);
    }
  }, [semesterFromUrl]);

  const filteredSemesters = useMemo(() => {
    return courses
      .map((group) => ({
        ...group,
        courses: group.courses.filter(
          (course) => majorFilter === "all" || course.major === majorFilter,
        ),
      }))
      .filter((group) => {
        const matchSemester =
          semesterFilter === "all" || String(group.semester) === semesterFilter;
        return matchSemester && group.courses.length > 0;
      });
  }, [courses, semesterFilter, majorFilter]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </header>

      <div className={styles["filter-bar"]}>
        <label className={styles.filter}>
          <select
            value={semesterFilter}
            onChange={(event) => setSemesterFilter(event.target.value)}
            aria-label="Lọc theo học kỳ"
          >
            {SEMESTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FontAwesomeIcon icon={faChevronDown} className={styles["filter-icon"]} />
        </label>

        <label className={styles.filter}>
          <select
            value={majorFilter}
            onChange={(event) => setMajorFilter(event.target.value)}
            aria-label="Lọc theo chuyên ngành"
          >
            {MAJOR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FontAwesomeIcon icon={faChevronDown} className={styles["filter-icon"]} />
        </label>
      </div>

      <div className={styles.content}>
        {filteredSemesters.map((group) => (
          <section key={group.semester} className={styles.semester}>
            <h2 className={styles["semester-title"]}>Kỳ {group.semester}</h2>
            <ul className={styles.grid}>
              {group.courses.map((course, index) => (
                <li key={`${group.semester}-${course.code}-${index}`}>
                  <Link
                    to={
                      semesterFilter !== "all"
                        ? `${detailBasePath}/${course.code}?semester=${semesterFilter}`
                        : `${detailBasePath}/${course.code}`
                    }
                    className={styles.card}
                  >
                    <div className={styles.cardMain}>
                      <span className={styles.code}>{course.code}</span>
                      {showSubjectName && course.name ? (
                        <span className={styles.name}>{course.name}</span>
                      ) : null}
                    </div>
                    <span
                      className={`${styles.badge} ${course.major === "AI" ? styles["badge-ai"] : styles["badge-se"]}`}
                    >
                      {course.major}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {filteredSemesters.length === 0 && (
          <p className={styles.empty}>Không có môn học phù hợp với bộ lọc.</p>
        )}
      </div>
    </div>
  );
}

export default CourseCatalogPage;
