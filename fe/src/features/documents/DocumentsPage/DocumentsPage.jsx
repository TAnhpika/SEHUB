import CourseCatalogPage from "@/features/subjects/CourseCatalogPage/CourseCatalogPage";
import { getSubjectCatalogPath } from "@/utils/subjectPaths";
import { useReviewCourses } from "@/features/review/ReviewQuestionsPage/reviewData";

function DocumentsPage({ scope = "community" }) {
  const { courses, loading } = useReviewCourses();

  if (loading) {
    return null;
  }

  return (
    <CourseCatalogPage
      title="Tài liệu học tập"
      subtitle="Bài giảng, slide và giáo trình theo môn — Basic xem 3 trang, Premium xem & tải full"
      courses={courses}
      detailBasePath={getSubjectCatalogPath("documents", scope)}
    />
  );
}

export default DocumentsPage;
