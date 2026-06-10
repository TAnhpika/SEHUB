import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { loadAdminReportById } from "@/features/admin/moderation/adminReportData";

/** Deep link — chuyển về workspace với báo cáo đã chọn */
function AdminReportDetailPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadAdminReportById(id).then((item) => {
      if (!cancelled) {
        setReport(item);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return null;
  }

  if (!report) {
    return <Navigate to="/admin/moderation" replace />;
  }

  return <Navigate to={`/admin/moderation?id=${report.id}`} replace />;
}

export default AdminReportDetailPage;
