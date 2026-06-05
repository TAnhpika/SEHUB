import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import StatusBadge from "@/features/admin/shared/StatusBadge";
import payStyles from "@/features/admin/payments/AdminPayments.module.css";

function formatDateTime(iso) {
  if (!iso) return "—";
  return iso.slice(0, 16).replace("T", " ");
}

/**
 * @param {{
 *   refunds: Array<object>;
 *   refundableCount?: number;
 *   onViewInTable: () => void;
 *   onStartRefund: () => void;
 * }} props
 */
function RefundedPaymentsPanel({
  refunds,
  refundableCount = 0,
  onViewInTable,
  onStartRefund,
}) {
  if (refunds.length === 0) return null;

  return (
    <section
      id="admin-refunds-panel"
      className={payStyles.refundPanel}
      aria-label="Đơn đã hoàn tiền"
    >
      <header className={payStyles.refundPanelHead}>
        <div className={payStyles.refundPanelTitleWrap}>
          <span className={payStyles.refundPanelIcon} aria-hidden>
            <FontAwesomeIcon icon={faRotateLeft} />
          </span>
          <div>
            <h2 className={payStyles.refundPanelTitle}>
              Đơn đã hoàn tiền ({refunds.length})
            </h2>
            <p className={payStyles.refundPanelDesc}>
              Panel này chỉ xem lịch sử. Bấm「Hoàn đơn mới」hoặc thẻ KPI「Đã kích hoạt」để mở đơn
              cần hoàn.
            </p>
          </div>
        </div>
        <div className={payStyles.refundPanelActions}>
          {refundableCount > 0 ? (
            <button type="button" className={payStyles.refundPanelPrimary} onClick={onStartRefund}>
              Hoàn đơn mới ({refundableCount})
            </button>
          ) : null}
          <button type="button" className={payStyles.refundPanelLink} onClick={onViewInTable}>
            Lọc trong bảng
          </button>
        </div>
      </header>

      <ul className={payStyles.refundList}>
        {refunds.map((payment) => (
          <li key={payment.id} className={payStyles.refundCard}>
            <div className={payStyles.refundCardMain}>
              <div className={payStyles.refundCardTop}>
                <strong className={payStyles.refundPayos}>{payment.payosOrderId}</strong>
                <StatusBadge status="refunded" label="Đã hoàn tiền" />
              </div>
              <p className={payStyles.refundMeta}>
                @{payment.username} · {payment.planLabel} ·{" "}
                <strong>{payment.amountLabel}</strong>
              </p>
              <p className={payStyles.refundReason}>
                {payment.refundReason ?? payment.note ?? "Không có ghi chú hoàn tiền."}
              </p>
            </div>
            <dl className={payStyles.refundDates}>
              <div>
                <dt>Thanh toán</dt>
                <dd>{formatDateTime(payment.activatedAt ?? payment.webhookAt)}</dd>
              </div>
              <div>
                <dt>Hoàn tiền</dt>
                <dd>{formatDateTime(payment.refundedAt)}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default RefundedPaymentsPanel;
