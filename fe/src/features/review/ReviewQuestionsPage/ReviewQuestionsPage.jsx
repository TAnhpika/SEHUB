import CourseCatalogPage from "@/features/subjects/CourseCatalogPage/CourseCatalogPage";
import CourseCatalogSkeleton from "@/features/subjects/CourseCatalogSkeleton/CourseCatalogSkeleton";
import { getSubjectCatalogPath } from "@/utils/subjectPaths";
import { useReviewCourses } from "./reviewData";

function ReviewQuestionsPage({ scope = "community" }) {
  const { courses, loading } = useReviewCourses({ apiOnly: true });

  if (loading) {
    return <CourseCatalogSkeleton />;
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
