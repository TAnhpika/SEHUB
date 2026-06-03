import CourseCatalogPage from "@/features/subjects/CourseCatalogPage/CourseCatalogPage";
import { REVIEW_COURSES } from "@/features/review/ReviewQuestionsPage/reviewData";

function DocumentsPage() {
  return (
    <CourseCatalogPage
      title="Tài liệu học tập"
      subtitle="Bài giảng, sách giáo khoa và tài liệu tham khảo"
      courses={REVIEW_COURSES}
      detailBasePath="/community/documents"
    />
  );
}

export default DocumentsPage;
