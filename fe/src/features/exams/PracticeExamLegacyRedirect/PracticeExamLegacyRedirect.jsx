import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "@/api/httpClient";
import { isValidGuid } from "@/features/feed/postUtils";
import { extractCourseSubjectCode } from "@/utils/examDisplay";

function PracticeExamLegacyRedirect() {
  const { examId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!examId || !isValidGuid(examId)) {
      navigate("/404", { replace: true });
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const exam = await apiRequest(`/api/v1/exams/${examId}`, { auth: false });
        const courseCode =
          extractCourseSubjectCode(exam.code, exam.title, exam.major) ?? exam.major?.trim();

        if (!courseCode || !exam.code) {
          if (!cancelled) {
            navigate("/404", { replace: true });
          }
          return;
        }

        if (!cancelled) {
          navigate(
            `/home/practical-exam/${encodeURIComponent(courseCode)}/${encodeURIComponent(exam.code)}`,
            { replace: true },
          );
        }
      } catch {
        if (!cancelled) {
          navigate("/404", { replace: true });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [examId, navigate]);

  return null;
}

export default PracticeExamLegacyRedirect;
