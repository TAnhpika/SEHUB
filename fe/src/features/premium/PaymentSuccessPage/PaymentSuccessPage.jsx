import { useMemo } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCopy } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import {
  buildTransactionId,
  formatVnd,
  getPlanById,
  PRICING_PLANS,
} from "@/features/landing/PricingModal/pricingData";
import styles from "./PaymentSuccessPage.module.css";

function PaymentSuccessPage() {
  const { planId } = useParams();
  const location = useLocation();
  const { showToast } = useToast();
  const plan = useMemo(() => getPlanById(planId), [planId]);
  const transactionId = location.state?.transactionId ?? buildTransactionId();

  if (!planId || !PRICING_PLANS.some((item) => item.id === planId)) {
    return <Navigate to="/home/premium" replace />;
  }

  function handleCopyTransactionId() {
    navigator.clipboard.writeText(transactionId).then(() => {
      showToast("Đã sao chép mã giao dịch.");
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon} aria-hidden="true">
          <FontAwesomeIcon icon={faCheck} />
        </div>

        <h1 className={styles.title}>Thanh toán thành công!</h1>
        <p className={styles.desc}>
          Cảm ơn bạn đã tin tưởng nâng cấp gói Premium. Tài khoản của bạn đã được kích hoạt đầy đủ
          các tính năng đặc quyền.
        </p>

        <div className={styles.details}>
          <h2 className={styles["details-title"]}>Chi tiết giao dịch</h2>

          <div className={styles.row}>
            <span className={styles.label}>Gói đăng ký</span>
            <span className={styles.value}>{plan.checkout.packageTitle}</span>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Tổng thanh toán</span>
            <span className={styles.price}>{formatVnd(plan.checkout.totalPrice)}</span>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Mã giao dịch</span>
            <div className={styles["transaction-row"]}>
              <span className={styles.transaction}>{transactionId}</span>
              <button
                type="button"
                className={styles.copy}
                aria-label="Sao chép mã giao dịch"
                onClick={handleCopyTransactionId}
              >
                <FontAwesomeIcon icon={faCopy} />
              </button>
            </div>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Phương thức</span>
            <span className={styles.method}>
              <span className={styles["payos-logo"]} aria-hidden="true">
                P
              </span>
              PayOS (VietQR)
            </span>
          </div>
        </div>

        <div className={styles.actions}>
          <Button to="/home" fullWidth>
            Về trang chủ
          </Button>
          <Link to="/community/final-exam" className={styles.secondary}>
            Khám phá Thư viện đề thi
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccessPage;
