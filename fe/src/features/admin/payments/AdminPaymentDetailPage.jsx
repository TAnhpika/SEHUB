import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import AdminBackLink from "@/features/admin/shared/AdminBackLink";
import StatusBadge from "@/features/admin/shared/StatusBadge";
import AdminRefundModal from "@/features/admin/payments/AdminRefundModal";
import AdminPaymentAuditSection from "@/features/admin/payments/AdminPaymentAuditSection";
import {
  approveRefundViaApi,
  completeRefundViaApi,
  confirmPayOsPaymentViaApi,
  loadPaymentAuditLog,
  loadPaymentById,
  submitPaymentRefundAction,
} from "@/features/admin/payments/adminPaymentData";
import { PAYMENT_STATUS_META, canAdminConfirmPayment } from "@/features/admin/payments/adminPaymentPolicy";
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
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);
  const [payment, setPayment] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([loadPaymentById(id), loadPaymentAuditLog()])
      .then(([item, auditItems]) => {
        if (!cancelled) {
          setPayment(item);
          setAuditLog(auditItems);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPayment(null);
          setAuditLog([]);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, refreshKey]);

  const auditRows = useMemo(
    () =>
      auditLog.filter(
        (row) =>
          row.meta?.paymentId === id ||
          row.meta?.orderId === id ||
          (payment?.payosOrderId && row.detail?.includes(payment.payosOrderId)),
      ),
    [auditLog, id, payment?.payosOrderId],
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
    if (confirmSubmitting) return;
    setConfirmSubmitting(true);
    try {
      const result = await confirmPayOsPaymentViaApi(payment.id, admin);
      showToast(result.message);
      if (result.ok) setRefreshKey((k) => k + 1);
    } finally {
      setConfirmSubmitting(false);
    }
  }

  function handleRefund({ reason }) {
    if (refundSubmitting) return;
    setRefundError("");
    setRefundSubmitting(true);

    const submit =
      payment.status === "refund_requested"
        ? approveRefundViaApi(payment.id, reason, admin)
        : payment.status === "processing_refund"
          ? completeRefundViaApi(payment.id, reason, admin)
          : submitPaymentRefundAction({ paymentId: payment.id, reason, adminUsername: admin });

    submit
      .then((result) => {
        if (!result.ok) {
          setRefundError(result.message);
          return;
        }
        showToast(result.message);
        setRefundOpen(false);
        setRefreshKey((k) => k + 1);
      })
      .finally(() => {
        setRefundSubmitting(false);
      });
  }

  const canRefund =
    payment.status === "activated" ||
    payment.status === "refund_requested" ||
    payment.status === "processing_refund";

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
          {canAdminConfirmPayment(payment.status) ? (
            <Button onClick={handleConfirm} disabled={confirmSubmitting} loading={confirmSubmitting}>
              Xác nhận & kích hoạt
            </Button>
          ) : null}
          {canRefund ? (
            <Button look="outline" onClick={() => { setRefundError(""); setRefundOpen(true); }}>
              {payment.status === "refund_requested"
                ? "Duyệt hoàn tiền"
                : payment.status === "processing_refund"
                  ? "Xác nhận đã hoàn tiền"
                  : "Hoàn tiền PayOS"}
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

      {auditRows.length > 0 ? <AdminPaymentAuditSection auditLog={auditRows} /> : null}

      <AdminRefundModal
        open={refundOpen}
        payment={payment}
        error={refundError}
        submitting={refundSubmitting}
        onClose={() => {
          if (refundSubmitting) return;
          setRefundOpen(false);
          setRefundError("");
        }}
        onSubmit={handleRefund}
      />
    </AdminPageLayout>
  );
}

export default AdminPaymentDetailPage;
