import { useMemo, useState } from "react";

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

  confirmPayOsPayment,

  getAdminPayments,

  getRefundedPayments,

  getPaidStudentsForTokenGrant,

  getPaymentAuditLog,

  getPaymentStats,

  grantManualTokens,

  processPayOsRefund,

} from "@/features/admin/payments/adminPaymentData";

import {

  FREE_DAILY_TOKEN_QUOTA,

  MAX_BONUS_TOKEN_BALANCE,

  PAYMENT_STATUS_META,

  PREMIUM_DAILY_TOKEN_QUOTA,

  PREMIUM_PLANS,

} from "@/features/admin/payments/adminPaymentPolicy";

import payStyles from "@/features/admin/payments/AdminPayments.module.css";

import AdminTableFooter from "@/features/admin/shared/AdminTableFooter";
import { ADMIN_PAGE_SIZES } from "@/features/admin/shared/adminPaginationConstants";
import { useAdminPagination } from "@/features/admin/shared/useAdminPagination";
import styles from "@/features/admin/shared/adminPage.module.css";



const STATUS_FILTER_OPTIONS = [

  { value: "all", label: "Tất cả trạng thái" },

  { value: "webhook_ok", label: "Chờ Admin xác nhận" },

  { value: "pending_payment", label: "Chờ thanh toán" },

  { value: "activated", label: "Đã kích hoạt" },

  { value: "failed", label: "Thất bại" },

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



  const payments = useMemo(() => getAdminPayments(), [refreshKey]);

  const stats = useMemo(() => getPaymentStats(), [refreshKey]);

  const auditLog = useMemo(() => getPaymentAuditLog(), [refreshKey]);

  const paidStudents = useMemo(() => getPaidStudentsForTokenGrant(), [refreshKey]);
  const refundedPayments = useMemo(() => getRefundedPayments(), [refreshKey]);
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

    const result = confirmPayOsPayment(paymentId, user?.username ?? "admin_sehub");

    if (result.ok) {

      showToast(result.message);

      bump();

    } else {

      showToast(result.message);

    }

  }



  function openRefundModal(paymentId) {
    setRefundError("");
    setRefundPaymentId(paymentId);
    setRefundOpen(true);
  }

  function handleRefund({ reason }) {
    if (!refundPaymentId) return;
    setRefundError("");

    const result = processPayOsRefund({
      paymentId: refundPaymentId,
      reason,
      adminUsername: user?.username ?? "admin_sehub",
    });

    if (!result.ok) {
      setRefundError(result.message);
      return;
    }

    showToast(result.message);
    setRefundOpen(false);
    setRefundPaymentId(null);
    bump();
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

      subtitle="Luồng PayOS 5 bước — Admin xác nhận kích hoạt Premium; cộng token thủ công có giới hạn & audit bất biến."

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
          if (value === "activated") focusActivatedForRefund();
        }}
        eligibleTokenCount={paidStudents.length}
      />

      <RefundedPaymentsPanel
        refunds={refundedPayments}
        refundableCount={stats.activated}
        onViewInTable={focusRefundsInTable}
        onStartRefund={focusActivatedForRefund}
      />

      <section id="admin-payments-table" className={styles.panel}>

        <div className={styles.panelHeader}>

          <div>

            <h2 className={styles.panelTitle}>Giao dịch PayOS</h2>

            <p className={styles.panelDesc}>

              Bước 5: xác nhận đơn「Chờ Admin xác nhận」. Đơn「Đã kích hoạt」→ cột Thao tác →{" "}

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

                        {payment.payosOrderId}

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

                          {payment.status === "webhook_ok" ? (

                            <button

                              type="button"

                              className={payStyles.confirmBtn}

                              onClick={() => handleConfirmPayment(payment.id)}

                            >

                              Xác nhận & kích hoạt

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

