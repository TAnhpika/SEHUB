import { Navigate, useLocation, useParams } from "react-router-dom";
import {
  getPracticeDoPath,
  getPracticeResultPath,
  resolveExamScope,
} from "@/utils/examFocusPaths";

/** Chuyển URL focus cũ sang màn làm bài thực hành trong layout thường */
export default function PracticeFocusRedirect({ result = false }) {
  const { courseCode, examId, questionIndex } = useParams();
  const location = useLocation();
  const scope = resolveExamScope(location.pathname, location.state);
  const to = result
    ? getPracticeResultPath(courseCode, examId, questionIndex, scope)
    : getPracticeDoPath(courseCode, examId, questionIndex, scope);

  return <Navigate to={to} replace state={location.state} />;
}
