import { Navigate, useParams } from "react-router-dom";
import { getAdminReportById } from "@/features/admin/moderation/adminReportData";

/** Deep link — chuyển về workspace với báo cáo đã chọn */
function AdminReportDetailPage() {
  const { id } = useParams();
  const report = getAdminReportById(id);

  if (!report) {
    return <Navigate to="/admin/moderation" replace />;
  }

  return <Navigate to={`/admin/moderation?id=${report.id}`} replace />;
}

export default AdminReportDetailPage;
