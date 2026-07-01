import CourseCatalogPage from "@/features/subjects/CourseCatalogPage/CourseCatalogPage";
import CourseCatalogSkeleton from "@/features/subjects/CourseCatalogSkeleton/CourseCatalogSkeleton";
import { getSubjectCatalogPath } from "@/utils/subjectPaths";
import { useReviewCourses } from "@/features/review/ReviewQuestionsPage/reviewData";

function PracticeQuestionsPage({ scope = "community" }) {
  const { courses, loading } = useReviewCourses({ apiOnly: true, contentFilter: "practice" });

  if (loading) {
    return <CourseCatalogSkeleton />;
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
