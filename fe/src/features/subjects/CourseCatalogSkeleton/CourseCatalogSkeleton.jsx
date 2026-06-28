import styles from "./CourseCatalogSkeleton.module.css";

function Shimmer({ className }) {
  return <span className={`${styles.skeleton} ${className ?? ""}`} aria-hidden="true" />;
}

function CourseCardSkeleton() {
  return (
    <li>
      <div className={styles.card}>
        <Shimmer className={styles.code} />
        <Shimmer className={styles.badge} />
      </div>
    </li>
  );
}

function SemesterSectionSkeleton({ cardCount = 8 }) {
  return (
    <section>
      <div className={styles["semester-title"]}>
        <Shimmer className={styles["semester-accent"]} />
        <Shimmer className={styles["semester-label"]} />
      </div>
      <ul className={styles.grid}>
        {Array.from({ length: cardCount }, (_, index) => (
          <CourseCardSkeleton key={index} />
        ))}
      </ul>
    </section>
  );
}

function CourseCatalogSkeleton() {
  return (
    <div className={styles.page} aria-busy="true" aria-label="Đang tải danh sách môn học">
      <header className={styles.header}>
        <Shimmer className={styles.title} />
        <Shimmer className={styles.subtitle} />
      </header>

      <div className={styles["filter-bar"]}>
        <Shimmer className={styles.filter} />
        <Shimmer className={`${styles.filter} ${styles.filterWide}`} />
      </div>

      <div className={styles.content}>
        <SemesterSectionSkeleton />
        <SemesterSectionSkeleton cardCount={6} />
      </div>
    </div>
  );
}

export default CourseCatalogSkeleton;
