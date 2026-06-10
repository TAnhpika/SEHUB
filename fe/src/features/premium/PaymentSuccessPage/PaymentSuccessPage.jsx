import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCopy } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import * as premiumApi from "@/api/premiumApi";
import {
  formatVnd,
  getPlanById,
} from "@/features/landing/PricingModal/pricingData";
import { isValidFePlanId } from "@/features/premium/premiumPlanMap";
import styles from "./PaymentSuccessPage.module.css";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 15;

function PaymentSuccessPage() {
  const { planId } = useParams();
  const location = useLocation();
  const { showToast } = useToast();
  const { refreshUser } = useAuth();
  const plan = useMemo(() => getPlanById(planId), [planId]);

  const orderId =
    location.state?.orderId ?? new URLSearchParams(location.search).get("orderId");
  const payOsOrderCode = location.state?.payOsOrderCode ?? "—";
  const paidAmount = location.state?.amount ?? plan.checkout.totalPrice;

  const [ready, setReady] = useState(false);
  const [activating, setActivating] = useState(true);

  useEffect(() => {
    if (!isValidFePlanId(planId)) {
      return undefined;
    }

    let cancelled = false;
    let attempts = 0;

    async function activatePremiumFromApi() {
      setActivating(true);
      try {
        while (!cancelled && attempts < MAX_POLL_ATTEMPTS) {
          const subscription = await premiumApi.getSubscription();
          if (subscription?.isActive) {
            await refreshUser();
            if (!cancelled) {
              setReady(true);
              setActivating(false);
            }
            return;
          }

          if (orderId) {
            const order = await premiumApi.getOrder(orderId);
            if (order.status === "Paid") {
              await refreshUser();
              if (!cancelled) {
                setReady(true);
                setActivating(false);
              }
              return;
            }
          }

          attempts += 1;
          await new Promise((resolve) => {
            window.setTimeout(resolve, POLL_INTERVAL_MS);
          });
        }

        if (!cancelled) {
          showToast("Chưa nhận được xác nhận Premium. Vui lòng thử đăng nhập lại sau.");
          setActivating(false);
        }
      } catch (error) {
        if (!cancelled) {
          showToast(error?.message ?? "Không thể xác nhận gói Premium.");
          setActivating(false);
        }
      }
    }

    activatePremiumFromApi();

    return () => {
      cancelled = true;
    };
  }, [planId, orderId, refreshUser, showToast]);

  if (!isValidFePlanId(planId)) {
    return <Navigate to="/home/premium" replace />;
  }

  if (!orderId) {
    return <Navigate to="/home/premium" replace />;
  }

  function handleCopyTransactionId() {
    navigator.clipboard.writeText(payOsOrderCode).then(() => {
      showToast("Đã sao chép mã giao dịch.");
    });
  }

  if (activating && !ready) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <p className={styles.desc}>Đang xác nhận thanh toán và kích hoạt Premium...</p>
        </div>
      </div>
    );
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
            <span className={styles.price}>{formatVnd(paidAmount)}</span>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Mã giao dịch</span>
            <div className={styles["transaction-row"]}>
              <span className={styles.transaction}>{payOsOrderCode}</span>
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
