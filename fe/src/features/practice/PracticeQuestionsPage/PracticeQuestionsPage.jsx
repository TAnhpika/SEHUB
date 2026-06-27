import CourseCatalogPage from "@/features/subjects/CourseCatalogPage/CourseCatalogPage";
import { getSubjectCatalogPath } from "@/utils/subjectPaths";
import { useReviewCourses } from "@/features/review/ReviewQuestionsPage/reviewData";

function PracticeQuestionsPage({ scope = "community" }) {
  const { courses, loading } = useReviewCourses();

  if (loading) {
    return null;
  }

  return (
    <CourseCatalogPage
      title="Đề thi thực hành"
      subtitle="Đề thi thực hành và tài liệu học tập"
      courses={courses}
      detailBasePath={getSubjectCatalogPath("practice", scope)}
    />
  );
}

export default PracticeQuestionsPage;
