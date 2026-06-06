import { useMemo, useState } from "react";
import Pagination from "@/common/Pagination/Pagination";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import DashboardBadge from "@/features/admin/dashboard/DashboardBadge";
import { ACTIVITY_BADGE_VARIANT } from "@/features/admin/dashboard/dashboardConstants";
import {
  ADMIN_ACTIVITY_LOG,
  ADMIN_ACTIVITY_PAGE_SIZE,
} from "@/features/admin/adminMockData";
import dash from "@/features/admin/dashboard/AdminDashboardPage.module.css";
import styles from "@/features/admin/shared/adminPage.module.css";

const ACTIVITY_TYPE_LABEL = {
  exam: "Đề thi",
  report: "Báo cáo",
  payment: "Thanh toán",
  user: "Tài khoản",
};

function AdminActivityLogPage() {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(ADMIN_ACTIVITY_LOG.length / ADMIN_ACTIVITY_PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * ADMIN_ACTIVITY_PAGE_SIZE;
    return ADMIN_ACTIVITY_LOG.slice(start, start + ADMIN_ACTIVITY_PAGE_SIZE);
  }, [safePage]);

  const rangeStart = (safePage - 1) * ADMIN_ACTIVITY_PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * ADMIN_ACTIVITY_PAGE_SIZE, ADMIN_ACTIVITY_LOG.length);

  function handlePageChange(next) {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <AdminPageLayout
      title="Nhật ký hoạt động"
      subtitle="Toàn bộ sự kiện hệ thống gần đây — đề thi, báo cáo, thanh toán và tài khoản."
      breadcrumbs={[
        { label: "Dashboard", to: "/admin" },
        { label: "Hoạt động gần đây" },
      ]}
    >
      <section className={`${styles.panel} ${dash.card}`}>
        <ul className={dash.activityList}>
          {pageItems.map((item) => (
            <li key={item.id} className={dash.activityItem}>
              <span className={dash.activityTime}>{item.time}</span>
              <span className={dash.activityText}>{item.text}</span>
              <DashboardBadge variant={ACTIVITY_BADGE_VARIANT[item.type] ?? "neutral"}>
                {ACTIVITY_TYPE_LABEL[item.type] ?? item.type}
              </DashboardBadge>
            </li>
          ))}
        </ul>

        <footer className={styles.activityLogFooter}>
          <p className={styles.activityLogMeta}>
            Hiển thị {rangeStart}–{rangeEnd} / {ADMIN_ACTIVITY_LOG.length} sự kiện
          </p>
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            ariaLabel="Phân trang nhật ký hoạt động"
          />
        </footer>
      </section>
    </AdminPageLayout>
  );
}

export default AdminActivityLogPage;
