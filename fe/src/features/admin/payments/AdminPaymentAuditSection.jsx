import { formatPaymentAuditText } from "@/features/admin/activity/paymentAuditFormat";
import AdminTableFooter from "@/features/admin/shared/AdminTableFooter";
import { ADMIN_PAGE_SIZES } from "@/features/admin/shared/adminPaginationConstants";
import { useAdminPagination } from "@/features/admin/shared/useAdminPagination";
import payStyles from "@/features/admin/payments/AdminPayments.module.css";
import styles from "@/features/admin/shared/adminPage.module.css";

function getAuditToneClass(action) {
  const normalized = String(action ?? "").toLowerCase();
  if (
    normalized.includes("refund") ||
    normalized === "payos_refund"
  ) {
    return payStyles.auditRefund;
  }
  if (
    normalized.includes("confirm") ||
    normalized.includes("verification") ||
    normalized.includes("webhook") ||
    normalized.includes("activate") ||
    normalized === "payos_confirm"
  ) {
    return payStyles.auditPayos;
  }
  return payStyles.auditToken;
}

function formatAuditTime(value) {
  if (!value) return "—";
  return String(value).slice(0, 16).replace("T", " ");
}

/**
 * @param {{ auditLog: Array<object> }} props
 */
function AdminPaymentAuditSection({ auditLog }) {
  const auditPage = useAdminPagination(auditLog, ADMIN_PAGE_SIZES.paymentAudit, [auditLog]);

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>Audit trail (bất biến)</h2>
          <p className={styles.panelDesc}>
            Mọi xác nhận PayOS và cộng token thủ công đều được ghi log — không chỉnh sửa.
          </p>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Admin</th>
              <th>Loại</th>
              <th>User</th>
              <th>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {auditPage.pageItems.length > 0 ? (
              auditPage.pageItems.map((row) => {
                const detail = formatPaymentAuditText(row.action, row.detail, row.payloadJson);
                return (
                  <tr key={row.id}>
                    <td>{formatAuditTime(row.at)}</td>
                    <td>@{row.admin}</td>
                    <td>
                      <span className={`${payStyles.auditType} ${getAuditToneClass(row.action)}`}>
                        {detail.split(" — ")[0]?.slice(0, 48) || row.action}
                      </span>
                    </td>
                    <td>{row.username !== "—" ? `@${row.username}` : "—"}</td>
                    <td>{detail}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} style={{ padding: "1.5rem", color: "#434655" }}>
                  Chưa có bản ghi audit.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminTableFooter
        rangeStart={auditPage.rangeStart}
        rangeEnd={auditPage.rangeEnd}
        total={auditPage.total}
        unit="bản ghi audit"
        currentPage={auditPage.safePage}
        totalPages={auditPage.totalPages}
        onPageChange={auditPage.handlePageChange}
        ariaLabel="Phân trang audit thanh toán"
      />
    </section>
  );
}

export default AdminPaymentAuditSection;
