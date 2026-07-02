import Button from "@/common/Button/Button";
import CourseCatalogPage from "@/features/subjects/CourseCatalogPage/CourseCatalogPage";
import CourseCatalogSkeleton from "@/features/subjects/CourseCatalogSkeleton/CourseCatalogSkeleton";
import { getSubjectCatalogPath } from "@/utils/subjectPaths";
import { useReviewCourses } from "./reviewData";
import styles from "./ReviewQuestionsPage.module.css";

function ReviewQuestionsPage({ scope = "community" }) {
  const { courses, loading, error, reload } = useReviewCourses({
    apiOnly: true,
    contentFilter: "final",
  });

  if (loading) {
    return <CourseCatalogSkeleton />;
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <p>{error}</p>
        <Button type="button" onClick={reload}>
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <CourseCatalogPage
      title="Đề thi cuối kỳ"
      subtitle="Đề thi cuối kỳ và tài liệu học tập"
      courses={courses}
      detailBasePath={getSubjectCatalogPath("review", scope)}
      showSubjectName={false}
    />
  );
}

export default ReviewQuestionsPage;
