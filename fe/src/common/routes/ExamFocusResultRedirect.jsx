import { Navigate, useLocation, useParams } from "react-router-dom";
import { getExamResultPath, resolveExamScope } from "@/utils/examFocusPaths";

/** Chuyển URL kết quả focus cũ sang màn thống kê trong MainLayout */
export default function ExamFocusResultRedirect() {
  const { courseCode, examId } = useParams();
  const location = useLocation();
  const scope = resolveExamScope(location.pathname, location.state);

  return (
    <Navigate
      to={getExamResultPath(courseCode, examId, scope)}
      replace
      state={location.state}
    />
  );
}
