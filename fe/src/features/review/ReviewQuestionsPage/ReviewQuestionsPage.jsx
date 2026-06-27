import CourseCatalogPage from "@/features/subjects/CourseCatalogPage/CourseCatalogPage";
import { getSubjectCatalogPath } from "@/utils/subjectPaths";
import { useReviewCourses } from "./reviewData";

function ReviewQuestionsPage({ scope = "community" }) {
  const { courses, loading } = useReviewCourses();

  if (loading) {
    return null;
  }

  return (
    <CourseCatalogPage
      title="Đề thi cuối kỳ"
      subtitle="Đề thi cuối kỳ và tài liệu học tập"
      courses={courses}
      detailBasePath={getSubjectCatalogPath("review", scope)}
    />
  );
}

export default ReviewQuestionsPage;
