import CourseCatalogPage from "@/features/subjects/CourseCatalogPage/CourseCatalogPage";
import { getSubjectCatalogPath } from "@/utils/subjectPaths";
import { REVIEW_COURSES } from "@/features/review/ReviewQuestionsPage/reviewData";

function PracticeQuestionsPage({ scope = "community" }) {
  return (
    <CourseCatalogPage
      title="Đề thi thực hành"
      subtitle="Đề thi thực hành và tài liệu học tập"
      courses={REVIEW_COURSES}
      detailBasePath={getSubjectCatalogPath("practice", scope)}
    />
  );
}

export default PracticeQuestionsPage;
