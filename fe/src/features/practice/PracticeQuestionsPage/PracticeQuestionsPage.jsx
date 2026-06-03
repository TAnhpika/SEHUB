import CourseCatalogPage from "@/features/subjects/CourseCatalogPage/CourseCatalogPage";
import { REVIEW_COURSES } from "@/features/review/ReviewQuestionsPage/reviewData";

function PracticeQuestionsPage() {
  return (
    <CourseCatalogPage
      title="Đề thi thực hành"
      subtitle="Đề thi thực hành và tài liệu học tập"
      courses={REVIEW_COURSES}
      detailBasePath="/community/pratical-exam"
    />
  );
}

export default PracticeQuestionsPage;
