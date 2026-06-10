import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context";
import { Link, Navigate, useLocation, useParams, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCopy, faSpinner } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import {
  buildTransactionId,
  formatVnd,
  loadPlanById,
  pollPremiumActivation,
  PRICING_PLANS,
} from "@/features/landing/PricingModal/pricingData";
import {
  clearCheckoutSession,
  readCheckoutSession,
  resolveCheckoutOrderId,
  resolveCheckoutTransactionId,
} from "@/features/premium/premiumCheckoutSession";
import styles from "./PaymentSuccessPage.module.css";

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

  const session = useMemo(() => readCheckoutSession(planId), [planId, pollAttempt]);
  const orderId = useMemo(
    () =>
      resolveCheckoutOrderId(planId, {
        stateOrderId: location.state?.orderId,
        queryOrderId: searchParams.get("orderId"),
      }),
    [location.state?.orderId, planId, searchParams],
  );
  const mockConfirm = Boolean(location.state?.mockConfirm);
  const alreadyActivated = Boolean(location.state?.activated) || isPremium;
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

  const confirmPremium = useCallback(async () => {
    if (alreadyActivated) {
      setActivationState("active");
      clearCheckoutSession();
      return;
    }

    if (mockConfirm || !orderId) {
      await activatePremium();
      setActivationState("active");
      clearCheckoutSession();
      return;
    }

    setActivationState("pending");

    try {
      const activated = await pollPremiumActivation(orderId);
      if (activated) {
        await activatePremium();
        setActivationState("active");
        clearCheckoutSession();
        return;
      }

      setActivationState("waiting");
    } catch (error) {
      setActivationState("waiting");
      showToast(error?.message ?? "Không xác nhận được Premium.");
    }
  }, [activatePremium, alreadyActivated, mockConfirm, orderId, showToast]);

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
  const isActive = activationState === "active" || isPremium;
  const isWaiting = activationState === "waiting";

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon} aria-hidden="true">
          {activationState === "pending" ? (
            <FontAwesomeIcon icon={faSpinner} spin />
          ) : (
            <FontAwesomeIcon icon={faCheck} />
          )}
        </div>

        <h1 className={styles.title}>
          {isActive ? "Thanh toán thành công!" : "Đã ghi nhận thanh toán"}
        </h1>
        <p className={styles.desc}>
          {isActive
            ? "Cảm ơn bạn đã tin tưởng nâng cấp gói Premium. Tài khoản của bạn đã được kích hoạt đầy đủ các tính năng đặc quyền."
            : isWaiting
              ? "PayOS đang xác nhận giao dịch. Premium sẽ tự kích hoạt trong vài phút sau khi webhook được xử lý."
              : "Đang xác nhận trạng thái Premium với máy chủ..."}
        </p>

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
              Kiểm tra lại Premium
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
