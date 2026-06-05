import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleXmark,
  faClock,
  faCoins,
  faHourglassHalf,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import payStyles from "@/features/admin/payments/AdminPayments.module.css";

const TONE_CLASS = {
  success: payStyles.kpiSuccess,
  warn: payStyles.kpiWarn,
  neutral: payStyles.kpiNeutral,
  refund: payStyles.kpiRefund,
  danger: payStyles.kpiDanger,
};

const ICONS = {
  revenue: faCoins,
  confirm: faClock,
  pending: faHourglassHalf,
  refund: faRotateLeft,
  failed: faCircleXmark,
  activated: faCircleCheck,
};

/**
 * @param {{
 *   stats: object;
 *   activeFilter: string;
 *   onFilter: (value: string) => void;
 *   eligibleTokenCount: number;
 * }} props
 */
function PaymentStatsStrip({ stats, activeFilter, onFilter, eligibleTokenCount }) {
  const items = [
    {
      id: "revenue",
      label: "Doanh thu tháng 6",
      value: stats.monthRevenueLabel,
      tone: "success",
      filter: null,
      hint: `${stats.activated} đơn đã kích hoạt`,
    },
    {
      id: "confirm",
      label: "Chờ xác nhận",
      value: stats.awaitingConfirm,
      tone: "warn",
      filter: "webhook_ok",
      hint: "Webhook OK — bước 5",
    },
    {
      id: "activated",
      label: "Đã kích hoạt",
      value: stats.activated,
      tone: "success",
      filter: "activated",
      hint: "Cột Thao tác → Hoàn tiền",
    },
    {
      id: "pending",
      label: "Chờ thanh toán",
      value: stats.pendingPay,
      tone: "neutral",
      filter: "pending_payment",
      hint: "SV chưa chuyển khoản",
    },
    {
      id: "refund",
      label: "Đã hoàn tiền",
      value: stats.refunded,
      tone: "refund",
      filter: "refunded",
      hint: stats.refunded > 0 ? stats.refundedAmountLabel : "Lịch sử hoàn",
    },
    {
      id: "failed",
      label: "Thất bại",
      value: stats.failed,
      tone: "danger",
      filter: "failed",
      hint: "Hết hạn / lỗi PayOS",
    },
  ];

  return (
    <div className={payStyles.kpiWrap}>
      <div className={payStyles.kpiStrip} role="list" aria-label="Thống kê thanh toán">
        {items.map((item) => {
          const isActive = item.filter && activeFilter === item.filter;
          const Tag = item.filter ? "button" : "article";

          return (
            <Tag
              key={item.id}
              type={item.filter ? "button" : undefined}
              role="listitem"
              className={[
                payStyles.kpiCard,
                TONE_CLASS[item.tone],
                isActive ? payStyles.kpiCardActive : "",
                item.filter ? payStyles.kpiCardClickable : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={item.filter ? () => onFilter(item.filter) : undefined}
              aria-pressed={item.filter ? isActive : undefined}
            >
              <span className={payStyles.kpiIcon} aria-hidden>
                <FontAwesomeIcon icon={ICONS[item.id]} />
              </span>
              <span className={payStyles.kpiLabel}>{item.label}</span>
              <span className={payStyles.kpiValue}>{item.value}</span>
              <span className={payStyles.kpiHint}>{item.hint}</span>
            </Tag>
          );
        })}
      </div>
      <p className={payStyles.kpiFootnote}>
        <strong>{eligibleTokenCount}</strong> SV đã chuyển khoản đủ — đủ điều kiện cộng token
        thủ công (nút trên header).
      </p>
    </div>
  );
}

export default PaymentStatsStrip;
