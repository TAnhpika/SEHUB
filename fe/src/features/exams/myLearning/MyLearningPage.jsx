import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import LearningActivitySection from "./LearningActivitySection";
import styles from "./MyLearningPage.module.css";

function MyLearningPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activityTab, setActivityTab] = useState("exams");

  useEffect(() => {
    const tab = searchParams.get("activity");
    if (tab === "exams" || tab === "practice") {
      setActivityTab(tab);
    }
  }, [searchParams]);

  const handleActivityTabChange = useCallback(
    (tab) => {
      setActivityTab(tab);
      const next = new URLSearchParams(searchParams);
      next.set("activity", tab);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Lịch sử học tập</h1>
        <p className={styles.subtitle}>
          Đề cuối kỳ bạn đã làm và bài thực hành đã nộp — chỉ mình bạn xem được.
        </p>
        <nav className={styles.nav} aria-label="Điều hướng đề thi">
          <Link to="/home/final-exam" className={styles.navLink}>
            ← Danh sách đề cuối kỳ
          </Link>
          <Link to="/home/practical-exam" className={styles.navLink}>
            ← Danh sách đề thực hành
          </Link>
        </nav>
      </header>

      <div className={styles.content}>
        <LearningActivitySection
          activeTab={activityTab}
          onTabChange={handleActivityTabChange}
          showPageHeader={false}
        />
      </div>
    </div>
  );
}

export default MyLearningPage;
