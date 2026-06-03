import CourseCatalogPage from "@/features/subjects/CourseCatalogPage/CourseCatalogPage";
import { REVIEW_COURSES } from "./reviewData";

function ReviewQuestionsPage() {
  return (
    <CourseCatalogPage
      title="Đề thi cuối kỳ"
      subtitle="Đề thi cuối kỳ và tài liệu học tập"
      courses={REVIEW_COURSES}
      detailBasePath="/community/final-exam"
    />
  );
}

export default ReviewQuestionsPage;
