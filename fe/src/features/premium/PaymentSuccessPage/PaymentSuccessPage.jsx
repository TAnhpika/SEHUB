import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context";
import { Link, Navigate, useLocation, useParams, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCircleInfo, faCopy, faSpinner } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import {
  buildTransactionId,
  formatVnd,
  loadPlanById,
  loadSubscriptionStatus,
  pollPremiumActivation,
  PRICING_PLANS,
} from "@/features/landing/PricingModal/pricingData";
import {
  clearCheckoutSession,
  readCheckoutSession,
  resolveCheckoutOrderId,
  resolveCheckoutTransactionId,
} from "@/features/premium/premiumCheckoutSession";
import {
  formatPremiumExpiryDate,
  getPremiumDaysRemaining,
} from "@/utils/premiumSubscription";
import styles from "./PaymentSuccessPage.module.css";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

function PaymentSuccessPage() {
  const { planId } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const { activatePremium, isPremium } = useAuth();
  const [plan, setPlan] = useState(null);
  const [planReady, setPlanReady] = useState(false);
  const [activationState, setActivationState] = useState("pending");
  const [pollAttempt, setPollAttempt] = useState(0);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);

  const session = useMemo(() => readCheckoutSession(planId), [planId, pollAttempt]);
  const orderId = useMemo(
    () =>
      resolveCheckoutOrderId(planId, {
        stateOrderId: location.state?.orderId,
        queryOrderId: searchParams.get("orderId"),
      }),
    [location.state?.orderId, planId, searchParams],
  );
  const paidThisSession = Boolean(location.state?.activated);
  const manualConfirmRequired = Boolean(location.state?.manualConfirmRequired);
  const mockConfirm = USE_MOCK && Boolean(location.state?.mockConfirm);
  const transactionId =
    resolveCheckoutTransactionId(planId, {
      stateTransactionId: location.state?.transactionId,
      session,
    }) ?? buildTransactionId();

  useEffect(() => {
    let cancelled = false;
    setPlanReady(false);

    loadPlanById(planId)
      .then((loadedPlan) => {
        if (!cancelled) {
          setPlan(loadedPlan);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPlanReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [planId]);

  const refreshSubscriptionInfo = useCallback(async () => {
    try {
      const status = await loadSubscriptionStatus();
      setSubscriptionInfo(status);
      return status;
    } catch {
      return null;
    }
  }, []);

  const confirmPremium = useCallback(async () => {
    if (paidThisSession || mockConfirm) {
      await activatePremium();
      const status = await refreshSubscriptionInfo();
      setActivationState("active");
      clearCheckoutSession();
      if (mockConfirm && !paidThisSession) {
        showToast("Mock: Premium đã kích hoạt (dev).");
      }
      return status;
    }

    if (!orderId) {
      setActivationState("waiting");
      showToast("Thiếu mã đơn thanh toán. Kiểm tra lại sau khi PayOS xác nhận.");
      return null;
    }

    setActivationState("pending");

    try {
      const pollOptions = manualConfirmRequired
        ? { maxAttempts: 3, intervalMs: 2000, markWaitingConfirmation: true }
        : { markWaitingConfirmation: true };
      const activated = await pollPremiumActivation(orderId, pollOptions);
      if (activated) {
        await activatePremium();
        const status = await refreshSubscriptionInfo();
        setActivationState("active");
        clearCheckoutSession();
        return status;
      }

      setActivationState("waiting");
    } catch (error) {
      setActivationState("waiting");
      if (!manualConfirmRequired) {
        showToast(error?.message ?? "Không xác nhận được Premium.");
      }
    }

    return null;
  }, [
    activatePremium,
    manualConfirmRequired,
    mockConfirm,
    orderId,
    paidThisSession,
    refreshSubscriptionInfo,
    showToast,
  ]);

  useEffect(() => {
    confirmPremium();
  }, [confirmPremium, pollAttempt]);

  if (!planReady) {
    return null;
  }

  if (!planId || !plan || !PRICING_PLANS.some((item) => item.id === planId)) {
    return <Navigate to="/home/premium" replace />;
  }

  function handleCopyTransactionId() {
    navigator.clipboard.writeText(transactionId).then(() => {
      showToast("Đã sao chép mã giao dịch.");
    });
  }

  function handleRetryActivation() {
    setPollAttempt((value) => value + 1);
  }

  const checkout = plan.checkout;
  const isActive = activationState === "active";
  const isWaiting = activationState === "waiting";
  const needsManualConfirm = isWaiting && (manualConfirmRequired || Boolean(orderId));
  const expiresAt = subscriptionInfo?.expiresAt ?? null;
  const daysRemaining = getPremiumDaysRemaining(expiresAt);
  const isRenewal = isPremium && paidThisSession;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div
          className={`${styles.icon} ${isWaiting ? styles.iconWaiting : ""}`}
          aria-hidden="true"
        >
          {activationState === "pending" ? (
            <FontAwesomeIcon icon={faSpinner} spin />
          ) : isWaiting ? (
            <FontAwesomeIcon icon={faCircleInfo} />
          ) : (
            <FontAwesomeIcon icon={faCheck} />
          )}
        </div>

        <h1 className={styles.title}>
          {isActive
            ? isRenewal
              ? "Gia hạn Premium thành công!"
              : "Thanh toán thành công!"
            : isWaiting
              ? "Thanh toán đã ghi nhận — chờ kích hoạt"
              : "Đang xác nhận thanh toán"}
        </h1>
        <p className={styles.desc}>
          {isActive
            ? expiresAt
              ? `Premium của bạn ${daysRemaining === 0 ? "hết hạn hôm nay" : `còn ${daysRemaining} ngày`} · hết hạn ${formatPremiumExpiryDate(expiresAt)}.`
              : "Cảm ơn bạn đã tin tưởng nâng cấp gói Premium. Tài khoản đã được kích hoạt đầy đủ các tính năng đặc quyền."
            : isWaiting
              ? needsManualConfirm
                ? "PayOS chưa gửi xác nhận tự động về hệ thống. Giao dịch của bạn sẽ được Admin xác nhận thủ công trước khi Premium được kích hoạt."
                : "PayOS đang xác nhận giao dịch. Premium sẽ kích hoạt sau khi webhook được xử lý — thử kiểm tra lại sau vài phút."
              : "Đang xác nhận trạng thái thanh toán với máy chủ..."}
        </p>

        {needsManualConfirm ? (
          <div className={styles.alert} role="status">
            <p className={styles.alertTitle}>Cần xác nhận PayOS thủ công</p>
            <p className={styles.alertText}>
              Nếu bạn đã chuyển khoản thành công nhưng Premium chưa kích hoạt, có thể do
              webhook PayOS chưa tới máy chủ (ví dụ môi trường dev chưa bật ngrok). Admin
              sẽ đối chiếu và xác nhận giao dịch trên trang quản trị thanh toán.
            </p>
            {orderId ? (
              <p className={styles.alertMeta}>
                Mã đơn cần Admin duyệt: <strong>{orderId}</strong>
              </p>
            ) : null}
          </div>
        ) : null}

        <div className={styles.details}>
          <h2 className={styles["details-title"]}>Chi tiết giao dịch</h2>

          <div className={styles.row}>
            <span className={styles.label}>Gói đăng ký</span>
            <span className={styles.value}>{checkout.packageTitle}</span>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Tổng thanh toán</span>
            <span className={styles.price}>{formatVnd(checkout.totalPrice)}</span>
          </div>

          {expiresAt && isActive ? (
            <div className={styles.row}>
              <span className={styles.label}>Hết hạn Premium</span>
              <span className={styles.value}>
                {formatPremiumExpiryDate(expiresAt)}
                {daysRemaining !== null ? ` (${daysRemaining} ngày)` : ""}
              </span>
            </div>
          ) : null}

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

          {orderId && (
            <div className={styles.row}>
              <span className={styles.label}>Mã đơn</span>
              <span className={styles.value}>{orderId}</span>
            </div>
          )}

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
          {isWaiting && (
            <Button fullWidth onClick={handleRetryActivation}>
              Kiểm tra lại thanh toán
            </Button>
          )}
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
