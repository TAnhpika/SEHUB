import CourseCatalogPage from "@/features/subjects/CourseCatalogPage/CourseCatalogPage";
import { getSubjectCatalogPath } from "@/utils/subjectPaths";
import { REVIEW_COURSES } from "@/features/review/ReviewQuestionsPage/reviewData";

function DocumentsPage({ scope = "community" }) {
  return (
    <CourseCatalogPage
      title="Tài liệu học tập"
      subtitle="Bài giảng, sách giáo khoa và tài liệu tham khảo"
      courses={REVIEW_COURSES}
      detailBasePath={getSubjectCatalogPath("documents", scope)}
    />
  );
}

export default DocumentsPage;
