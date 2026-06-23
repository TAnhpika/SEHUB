import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Button from "@/common/Button/Button";

import { useToast } from "@/common/Toast/ToastProvider";

import { useAuth } from "@/context";

import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";

import StatusBadge from "@/features/admin/shared/StatusBadge";

import AdminManualTokenModal from "@/features/admin/payments/AdminManualTokenModal";
import AdminRefundModal from "@/features/admin/payments/AdminRefundModal";
import PaymentStatsStrip from "@/features/admin/payments/PaymentStatsStrip";
import RefundedPaymentsPanel from "@/features/admin/payments/RefundedPaymentsPanel";

import {

  approveRefundViaApi,

  confirmPayOsPaymentViaApi,

  getPaidStudentsForTokenGrant,

  getPaymentAuditLog,

  getPaymentStatsFromList,

  getRefundedPaymentsFromList,

  getPendingRefundRequestsFromList,

  grantManualTokens,

  loadAdminPayments,

  processPayOsRefund,

} from "@/features/admin/payments/adminPaymentData";

import {

  FREE_DAILY_TOKEN_QUOTA,

  MAX_BONUS_TOKEN_BALANCE,

  PAYMENT_STATUS_META,

  PREMIUM_DAILY_TOKEN_QUOTA,

  PREMIUM_PLANS,

  canAdminConfirmPayment,

} from "@/features/admin/payments/adminPaymentPolicy";

import payStyles from "@/features/admin/payments/AdminPayments.module.css";

import AdminTableFooter from "@/features/admin/shared/AdminTableFooter";
import { ADMIN_PAGE_SIZES } from "@/features/admin/shared/adminPaginationConstants";
import { useAdminPagination } from "@/features/admin/shared/useAdminPagination";
import styles from "@/features/admin/shared/adminPage.module.css";



const STATUS_FILTER_OPTIONS = [

  { value: "all", label: "Tất cả trạng thái" },

  { value: "waiting_confirmation", label: "Chờ Admin xác nhận" },

  { value: "webhook_ok", label: "Chờ Admin xác nhận (legacy)" },

  { value: "pending_payment", label: "Chờ thanh toán" },

  { value: "activated", label: "Đã kích hoạt" },

  { value: "failed", label: "Thất bại" },

  { value: "expired", label: "Hết hạn xác nhận" },

  { value: "refund_requested", label: "Chờ duyệt hoàn tiền" },

  { value: "processing_refund", label: "Đang xử lý hoàn tiền" },

  { value: "refunded", label: "Đã hoàn tiền" },

];



const AUDIT_LABELS = {

  payos_confirm: "Xác nhận PayOS",

  payos_refund: "Hoàn tiền PayOS",

  manual_token: "Cộng token thủ công",

  manual_premium: "Cấp Premium thủ công",

};



function AdminPaymentListPage() {

  const { showToast } = useToast();

  const { user } = useAuth();

  const [refreshKey, setRefreshKey] = useState(0);

  const [grantOpen, setGrantOpen] = useState(false);

  const [grantError, setGrantError] = useState("");

  const [refundOpen, setRefundOpen] = useState(false);

  const [refundPaymentId, setRefundPaymentId] = useState(null);

  const [refundError, setRefundError] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [search, setSearch] = useState("");
  const [payments, setPayments] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoadError("");
    loadAdminPayments()
      .then((items) => {
        if (!cancelled) setPayments(items);
      })
      .catch((error) => {
        if (!cancelled) {
          setPayments([]);
          setLoadError(error?.message ?? "Không tải được danh sách thanh toán.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const stats = useMemo(() => getPaymentStatsFromList(payments), [payments]);

  const auditLog = useMemo(() => getPaymentAuditLog(), [refreshKey]);

  const paidStudents = useMemo(() => getPaidStudentsForTokenGrant(), [refreshKey]);
  const refundedPayments = useMemo(() => getRefundedPaymentsFromList(payments), [payments]);
  const pendingRefundRequests = useMemo(
    () => getPendingRefundRequestsFromList(payments),
    [payments],
  );
  const refundPayment = useMemo(
    () => payments.find((p) => p.id === refundPaymentId) ?? null,
    [payments, refundPaymentId],
  );

  function focusRefundsInTable() {
    setStatusFilter("refunded");
    setSearch("");
    requestAnimationFrame(() => {
      document.getElementById("admin-payments-table")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function focusPendingRefunds() {
    setStatusFilter("refund_requested");
    setSearch("");
    requestAnimationFrame(() => {
      document.getElementById("admin-payments-table")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function focusActivatedForRefund() {
    setStatusFilter("activated");
    setSearch("");
    requestAnimationFrame(() => {
      document.getElementById("admin-payments-table")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }



  const filteredPayments = useMemo(() => {

    const q = search.trim().toLowerCase();

    return payments.filter((payment) => {

      const matchStatus = statusFilter === "all" || payment.status === statusFilter;

      const matchSearch =

        !q ||

        payment.username.toLowerCase().includes(q) ||

        (payment.userEmail ?? "").toLowerCase().includes(q) ||

        payment.payosOrderId.toLowerCase().includes(q) ||

        payment.transferContent.toLowerCase().includes(q);

      return matchStatus && matchSearch;

    });

  }, [payments, statusFilter, search]);

  const paymentPage = useAdminPagination(
    filteredPayments,
    ADMIN_PAGE_SIZES.payments,
    [statusFilter, search, refreshKey],
  );
  const auditPage = useAdminPagination(
    auditLog,
    ADMIN_PAGE_SIZES.paymentAudit,
    [refreshKey],
  );

  function bump() {

    setRefreshKey((k) => k + 1);

  }



  function handleConfirmPayment(paymentId) {

    confirmPayOsPaymentViaApi(paymentId, user?.username ?? "admin_sehub").then((result) => {

      if (result.ok) {

        showToast(result.message);

        bump();

      } else {

        showToast(result.message);

      }

    });

  }



  function openRefundModal(paymentId) {
    setRefundError("");
    setRefundPaymentId(paymentId);
    setRefundOpen(true);
  }

  function handleRefund({ reason }) {
    if (!refundPaymentId) return;
    setRefundError("");

    const payment = payments.find((p) => p.id === refundPaymentId);
    const approvePending = payment?.status === "refund_requested";

    const submit = approvePending
      ? approveRefundViaApi(refundPaymentId, reason)
      : Promise.resolve(
          processPayOsRefund({
            paymentId: refundPaymentId,
            reason,
            adminUsername: user?.username ?? "admin_sehub",
          }),
        );

    submit.then((result) => {
      if (!result.ok) {
        setRefundError(result.message);
        return;
      }

      showToast(result.message);
      setRefundOpen(false);
      setRefundPaymentId(null);
      bump();
    });
  }

  function handleQuickApproveRefund(paymentId) {
    approveRefundViaApi(paymentId, "Admin duyệt yêu cầu hoàn tiền của sinh viên").then(
      (result) => {
        if (result.ok) {
          showToast(result.message);
          bump();
        } else {
          showToast(result.message);
        }
      },
    );
  }

  function handleGrantTokens({ username, amount, reason }) {

    setGrantError("");

    const result = grantManualTokens({

      username,

      amount,

      reason,

      adminUsername: user?.username ?? "admin_sehub",

    });

    if (!result.ok) {

      setGrantError(result.message);

      return;

    }

    showToast(result.message);

    setGrantOpen(false);

    bump();

  }



  const hasActiveFilters = statusFilter !== "all" || search.trim() !== "";



  return (

    <AdminPageLayout

      title="Thanh toán & PayOS"


      breadcrumbs={[{ label: "Dashboard", to: "/admin" }, { label: "Quản lý thanh toán" }]}

      actions={

        <Button onClick={() => { setGrantError(""); setGrantOpen(true); }}>

          Cộng token thủ công

        </Button>

      }

    >

      <div className={payStyles.flowBanner}>

        <strong>Luồng nghiệp vụ PayOS (§3.8)</strong>

        <ol className={payStyles.flowSteps}>

          <li>1. Chọn gói</li>

          <li>2. Tạo đơn QR</li>

          <li>3. SV chuyển khoản</li>

          <li>4. Webhook PayOS</li>

          <li>5. Admin xác nhận → Premium + token</li>

        </ol>

        <div className={payStyles.tokenRules}>

          <div className={payStyles.tokenRuleCard}>

            <strong>Quota AI / ngày</strong>

            <span>

              Basic: {FREE_DAILY_TOKEN_QUOTA} token · Premium: {PREMIUM_DAILY_TOKEN_QUOTA}{" "}

              token (reset 00:00)

            </span>

          </div>

          <div className={payStyles.tokenRuleCard}>

            <strong>Tổng token thưởng (cộng thủ công)</strong>

            <span>

              Tối đa {MAX_BONUS_TOKEN_BALANCE} token / user — đã đủ 1.000 thì không cộng thêm

            </span>

          </div>

          <div className={payStyles.tokenRuleCard}>

            <strong>Điều kiện cộng token</strong>

            <span>Chỉ SV đã chuyển khoản đủ (webhook PayOS OK hoặc Premium đã kích hoạt)</span>

          </div>

        </div>

      </div>



      <PaymentStatsStrip
        stats={stats}
        activeFilter={statusFilter}
        onFilter={(value) => {
          setStatusFilter(value);
          if (value === "refunded") focusRefundsInTable();
          if (value === "refund_requested") focusPendingRefunds();
          if (value === "activated") focusActivatedForRefund();
        }}
        eligibleTokenCount={paidStudents.length}
      />

      {loadError ? (
        <div className={payStyles.refundHintBanner}>{loadError}</div>
      ) : null}

      {pendingRefundRequests.length > 0 ? (
        <div className={payStyles.refundHintBanner}>
          <span>
            Có <strong>{pendingRefundRequests.length}</strong> yêu cầu hoàn tiền từ sinh viên
            đang chờ duyệt.
          </span>
          <button
            type="button"
            className={payStyles.refundHintAction}
            onClick={focusPendingRefunds}
          >
            Xem yêu cầu chờ duyệt
          </button>
        </div>
      ) : null}

      <RefundedPaymentsPanel
        refunds={refundedPayments}
        refundableCount={stats.pendingRefund ?? pendingRefundRequests.length}
        onViewInTable={focusRefundsInTable}
        onStartRefund={focusPendingRefunds}
      />

      <section id="admin-payments-table" className={styles.panel}>

        <div className={styles.panelHeader}>

          <div>

            <h2 className={styles.panelTitle}>Giao dịch PayOS</h2>

            <p className={styles.panelDesc}>

              Bước 5: đối chiếu ngân hàng — đơn「Chờ thanh toán」hoặc「Chờ Admin xác nhận」→{" "}
              <strong>Xác nhận &amp; kích hoạt</strong>. Đơn「Đã kích hoạt」→ cột Thao tác →{" "}
              <strong>Hoàn tiền</strong>.

            </p>

          </div>

        </div>



        <div className={styles.filterShell}>

          <div className={styles.toolbar}>

            <input

              className={styles.search}

              type="search"

              placeholder="Tìm user, mã PayOS, nội dung CK…"

              value={search}

              onChange={(e) => setSearch(e.target.value)}

              aria-label="Tìm giao dịch"

            />

            <select

              className={styles.select}

              value={statusFilter}

              onChange={(e) => setStatusFilter(e.target.value)}

              aria-label="Lọc trạng thái"

            >

              {STATUS_FILTER_OPTIONS.map((opt) => (

                <option key={opt.value} value={opt.value}>

                  {opt.label}

                </option>

              ))}

            </select>

            <button

              type="button"

              className={styles.btnReset}

              disabled={!hasActiveFilters}

              onClick={() => {

                setSearch("");

                setStatusFilter("all");

              }}

            >

              Xóa bộ lọc

            </button>

          </div>

        </div>

        {statusFilter === "refunded" ? (
          <div className={payStyles.refundHintBanner}>
            <span>
              Đang xem <strong>lịch sử hoàn tiền</strong> — không có nút hoàn ở đây.
            </span>
            {stats.activated > 0 ? (
              <button
                type="button"
                className={payStyles.refundHintAction}
                onClick={focusActivatedForRefund}
              >
                Chuyển sang đơn cần hoàn ({stats.activated})
              </button>
            ) : null}
          </div>
        ) : null}

        <div className={styles.tableWrap}>

          <table className={styles.table}>

            <thead>

              <tr>

                <th>Mã PayOS</th>

                <th>Sinh viên</th>

                <th>Gói</th>

                <th>Số tiền</th>

                <th>Nội dung CK</th>

                <th>Trạng thái</th>

                <th>Thời gian</th>

                <th className={payStyles.actionCol}>Thao tác</th>

              </tr>

            </thead>

            <tbody>

              {filteredPayments.length > 0 ? (

                paymentPage.pageItems.map((payment) => {

                  const meta = PAYMENT_STATUS_META[payment.status];

                  return (

                    <tr key={payment.id}>

                      <td className={styles.cellMain}>

                        <Link to={`/admin/payments/${payment.id}`} className={styles.link}>
                          {payment.payosOrderId}
                        </Link>

                        {payment.note ? (

                          <span className={payStyles.payId}>{payment.note}</span>

                        ) : null}

                      </td>

                      <td>@{payment.username}</td>

                      <td>

                        {payment.planLabel}

                        {payment.voucher ? (

                          <span className={payStyles.payId}>{payment.voucher}</span>

                        ) : null}

                      </td>

                      <td>{payment.amountLabel}</td>

                      <td>

                        <code className={payStyles.transferCode}>

                          {payment.transferContent}

                        </code>

                      </td>

                      <td>

                        <StatusBadge status={meta.status} label={meta.label} />

                      </td>

                      <td>

                        <span>{payment.createdAt.slice(0, 10)}</span>

                        {payment.webhookAt ? (

                          <span className={payStyles.payId}>

                            Webhook: {payment.webhookAt.slice(0, 16).replace("T", " ")}

                          </span>

                        ) : null}

                      </td>

                      <td className={payStyles.actionCol}>

                        <div className={payStyles.actionCell}>

                          {canAdminConfirmPayment(payment.status) ? (

                            <button

                              type="button"

                              className={payStyles.confirmBtn}

                              onClick={() => handleConfirmPayment(payment.id)}

                            >

                              Xác nhận & kích hoạt

                            </button>

                          ) : payment.status === "refund_requested" ? (

                            <button

                              type="button"

                              className={payStyles.confirmBtn}

                              onClick={() => handleQuickApproveRefund(payment.id)}

                            >

                              Duyệt hoàn tiền

                            </button>

                          ) : payment.status === "activated" ? (

                            <button

                              type="button"

                              className={payStyles.refundBtn}

                              onClick={() => openRefundModal(payment.id)}

                            >

                              Hoàn tiền

                            </button>

                          ) : (

                            <span className={payStyles.payId}>—</span>

                          )}

                        </div>

                      </td>

                    </tr>

                  );

                })

              ) : (

                <tr>

                  <td colSpan={8} style={{ padding: "1.5rem", color: "#434655" }}>

                    Không có giao dịch phù hợp bộ lọc.

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

        <AdminTableFooter
          rangeStart={paymentPage.rangeStart}
          rangeEnd={paymentPage.rangeEnd}
          total={paymentPage.total}
          unit="giao dịch"
          currentPage={paymentPage.safePage}
          totalPages={paymentPage.totalPages}
          onPageChange={paymentPage.handlePageChange}
          ariaLabel="Phân trang giao dịch PayOS"
        />

      </section>



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

              {auditPage.pageItems.map((row) => (

                <tr key={row.id}>

                  <td>{row.at.slice(0, 16).replace("T", " ")}</td>

                  <td>@{row.admin}</td>

                  <td>

                    <span

                      className={`${payStyles.auditType} ${
                        row.action === "payos_confirm"
                          ? payStyles.auditPayos
                          : row.action === "payos_refund"
                            ? payStyles.auditRefund
                            : payStyles.auditToken
                      }`}

                    >

                      {AUDIT_LABELS[row.action] ?? row.action}

                    </span>

                  </td>

                  <td>@{row.username}</td>

                  <td>{row.detail}</td>

                </tr>

              ))}

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



      <AdminManualTokenModal

        open={grantOpen}

        students={paidStudents}

        error={grantError}

        onClose={() => {

          setGrantOpen(false);

          setGrantError("");

        }}

        onSubmit={handleGrantTokens}

      />

      <AdminRefundModal
        open={refundOpen}
        payment={refundPayment}
        error={refundError}
        onClose={() => {
          setRefundOpen(false);
          setRefundPaymentId(null);
          setRefundError("");
        }}
        onSubmit={handleRefund}
      />

    </AdminPageLayout>

  );

}



export default AdminPaymentListPage;

