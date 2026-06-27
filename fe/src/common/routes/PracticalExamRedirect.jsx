import { Navigate, useLocation } from "react-router-dom";

function PracticalExamRedirect() {
  const location = useLocation();
  const nextPath = location.pathname.replace("/pratical-exam", "/practical-exam");

  return <Navigate to={`${nextPath}${location.search}${location.hash}`} replace />;
}

export default PracticalExamRedirect;
