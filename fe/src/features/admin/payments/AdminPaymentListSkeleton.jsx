import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import {
  StaffGenericTableSkeleton,
  StaffStatsStripSkeleton,
} from "@/common/Skeleton/StaffSkeleton";
import styles from "@/features/admin/shared/adminPage.module.css";

function AdminPaymentListSkeleton() {
  return (
    <AdminPageLayout
      title="Thanh toán & PayOS"
      breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Quản lý thanh toán" }]}
    >
      <StaffStatsStripSkeleton count={4} aria-label="Đang tải thống kê thanh toán" />
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Sinh viên</th>
              <th>Gói</th>
              <th>Số tiền</th>
              <th>Trạng thái</th>
              <th>Thời gian</th>
              <th />
            </tr>
          </thead>
          <StaffGenericTableSkeleton columns={6} aria-label="Đang tải danh sách thanh toán" />
        </table>
      </div>
    </AdminPageLayout>
  );
}

export default AdminPaymentListSkeleton;
