import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import AdminBackLink from "@/features/admin/shared/AdminBackLink";
import StatusBadge from "@/features/admin/shared/StatusBadge";
import AdminRefundModal from "@/features/admin/payments/AdminRefundModal";
import {
  confirmPayOsPaymentViaApi,
  getPaymentAuditLog,
  loadPaymentById,
  processPayOsRefund,
} from "@/features/admin/payments/adminPaymentData";
import { PAYMENT_STATUS_META } from "@/features/admin/payments/adminPaymentPolicy";
import { getAdminUserDetailUrl } from "@/features/admin/users/adminUserStore";
import payStyles from "@/features/admin/payments/AdminPayments.module.css";
import styles from "@/features/admin/shared/adminPage.module.css";

function AdminPaymentDetailPage() {
  const { id } = useParams();
  const { showToast } = useToast();
  const { user: authUser } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundError, setRefundError] = useState("");
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadPaymentById(id).then((item) => {
      if (!cancelled) {
        setPayment(item);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id, refreshKey]);

  const auditRows = useMemo(
    () =>
      getPaymentAuditLog().filter(
        (row) => row.meta?.paymentId === id || row.detail.includes(payment?.payosOrderId ?? ""),
      ),
    [id, payment?.payosOrderId, refreshKey],
  );

  if (loading) {
    return (
      <AdminPageLayout
        title="Đang tải..."
        breadcrumbs={[
          { label: "Dashboard", to: "/admin" },
          { label: "Thanh toán", to: "/admin/payments" },
        ]}
      >
        <p className={styles.empty}>Đang tải giao dịch...</p>
      </AdminPageLayout>
    );
  }

  if (!payment) {
    return (
      <AdminPageLayout
        title="Không tìm thấy"
        breadcrumbs={[
          { label: "Dashboard", to: "/admin" },
          { label: "Thanh toán", to: "/admin/payments" },
          { label: "Lỗi" },
        ]}
      >
        <p className={styles.empty}>Không tìm thấy giao dịch.</p>
        <AdminBackLink to="/admin/payments" label="Thanh toán" />
      </AdminPageLayout>
    );
  }

  const meta = PAYMENT_STATUS_META[payment.status];
  const userDetailUrl = getAdminUserDetailUrl(payment.username);
  const admin = authUser?.username ?? "admin_sehub";

  async function handleConfirm() {
    const result = await confirmPayOsPaymentViaApi(payment.id, admin);
    showToast(result.message);
    if (result.ok) setRefreshKey((k) => k + 1);
  }

  function handleRefund({ reason }) {
    setRefundError("");
    const result = processPayOsRefund({
      paymentId: payment.id,
      reason,
      adminUsername: admin,
    });
    if (!result.ok) {
      setRefundError(result.message);
      return;
    }
    showToast(result.message);
    setRefundOpen(false);
    setRefreshKey((k) => k + 1);
  }

  return (
    <AdminPageLayout
      title={payment.payosOrderId}
      subtitle={`@${payment.username} · ${payment.planLabel} · ${payment.amountLabel}`}
      breadcrumbs={[
        { label: "Dashboard", to: "/admin" },
        { label: "Thanh toán", to: "/admin/payments" },
        { label: payment.payosOrderId },
      ]}
      actions={
        <>
          {payment.status === "webhook_ok" ? (
            <Button onClick={handleConfirm}>Xác nhận & kích hoạt</Button>
          ) : null}
          {payment.status === "activated" ? (
            <Button look="outline" onClick={() => setRefundOpen(true)}>
              Hoàn tiền PayOS
            </Button>
          ) : null}
        </>
      }
    >
      <AdminBackLink to="/admin/payments" label="Thanh toán" />

      <section className={styles.panel} style={{ marginTop: "1rem" }}>
        <h2 className={styles.panelTitle}>Thông tin giao dịch</h2>
        <div className={styles.divider} />
        <dl className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <dt>Mã PayOS</dt>
            <dd className={styles.cellMain}>{payment.payosOrderId}</dd>
          </div>
          <div className={styles.detailItem}>
            <dt>Sinh viên</dt>
            <dd>
              {userDetailUrl ? (
                <Link to={userDetailUrl} className={styles.link}>
                  @{payment.username}
                </Link>
              ) : (
                `@${payment.username}`
              )}
            </dd>
          </div>
          <div className={styles.detailItem}>
            <dt>Gói Premium</dt>
            <dd>
              {payment.planLabel}
              {payment.voucher ? (
                <span className={payStyles.payId}> · {payment.voucher}</span>
              ) : null}
            </dd>
          </div>
          <div className={styles.detailItem}>
            <dt>Số tiền</dt>
            <dd>{payment.amountLabel}</dd>
          </div>
          <div className={styles.detailItem}>
            <dt>Nội dung CK</dt>
            <dd>
              <code className={payStyles.transferCode}>{payment.transferContent}</code>
            </dd>
          </div>
          <div className={styles.detailItem}>
            <dt>Trạng thái</dt>
            <dd>
              <StatusBadge status={meta.status} label={meta.label} />
              <span className={styles.hint} style={{ display: "block", marginTop: "0.25rem" }}>
                {meta.desc}
              </span>
            </dd>
          </div>
          <div className={styles.detailItem}>
            <dt>Tạo lúc</dt>
            <dd>{payment.createdAt.replace("T", " ")}</dd>
          </div>
          {payment.webhookAt ? (
            <div className={styles.detailItem}>
              <dt>Webhook PayOS</dt>
              <dd>{payment.webhookAt.replace("T", " ")}</dd>
            </div>
          ) : null}
          {payment.activatedAt ? (
            <div className={styles.detailItem}>
              <dt>Kích hoạt Premium</dt>
              <dd>{payment.activatedAt.replace("T", " ")}</dd>
            </div>
          ) : null}
          {payment.refundedAt ? (
            <div className={styles.detailItem}>
              <dt>Hoàn tiền</dt>
              <dd>
                {payment.refundedAt.replace("T", " ")}
                {payment.refundReason ? (
                  <span className={styles.hint} style={{ display: "block" }}>
                    {payment.refundReason}
                  </span>
                ) : null}
              </dd>
            </div>
          ) : null}
          {payment.note ? (
            <div className={styles.detailItem}>
              <dt>Ghi chú</dt>
              <dd>{payment.note}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      {auditRows.length > 0 ? (
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Audit liên quan</h2>
          <div className={styles.divider} />
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Admin</th>
                  <th>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {auditRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.at.slice(0, 16).replace("T", " ")}</td>
                    <td>@{row.admin}</td>
                    <td>{row.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <AdminRefundModal
        open={refundOpen}
        payment={payment}
        error={refundError}
        onClose={() => {
          setRefundOpen(false);
          setRefundError("");
        }}
        onSubmit={handleRefund}
      />
    </AdminPageLayout>
  );
}

export default AdminPaymentDetailPage;
