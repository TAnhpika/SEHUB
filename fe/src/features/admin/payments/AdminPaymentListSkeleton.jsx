import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import styles from "@/features/admin/shared/adminPage.module.css";

function AdminPaymentListSkeleton() {
  return (
    <AdminPageLayout
      title="Thanh toán & PayOS"
      breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Quản lý thanh toán" }]}
    >
      <p className={styles.empty}>Đang tải danh sách thanh toán…</p>
    </AdminPageLayout>
  );
}

export default AdminPaymentListSkeleton;
