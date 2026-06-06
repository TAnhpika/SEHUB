import CourseCatalogPage from "@/features/subjects/CourseCatalogPage/CourseCatalogPage";
import { getSubjectCatalogPath } from "@/utils/subjectPaths";
import { REVIEW_COURSES } from "./reviewData";

function ReviewQuestionsPage({ scope = "community" }) {
  return (
    <CourseCatalogPage
      title="Đề thi cuối kỳ"
      subtitle="Đề thi cuối kỳ và tài liệu học tập"
      courses={REVIEW_COURSES}
      detailBasePath={getSubjectCatalogPath("review", scope)}
    />
  );
}

export default ReviewQuestionsPage;
