import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCopy,
  faLock,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import PaymentQrCode from "./PaymentQrCode";
import Button from "@/common/Button/Button";
import { useAuth } from "@/context";
import { useToast } from "@/common/Toast/ToastProvider";
import {
  clearCheckoutSession,
  saveCheckoutSession,
} from "@/features/premium/premiumCheckoutSession";
import {
  buildTransactionId,
  buildTransferContent,
  createCheckoutOrder,
  formatVnd,
  getCheckoutOrder,
  loadPlanById,
  PAYMENT_INFO,
  PRICING_PLANS,
} from "@/features/landing/PricingModal/pricingData";
import styles from "./CheckoutPage.module.css";

const COUNTDOWN_SECONDS = 15 * 60;
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

function formatTimer(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function resolveSecondsUntil(expiredAt) {
  if (!expiredAt) return COUNTDOWN_SECONDS;
  const diffMs = new Date(expiredAt).getTime() - Date.now();
  return Math.max(0, Math.floor(diffMs / 1000));
}

function CopyField({ label, value }) {
  const { showToast } = useToast();

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      showToast(`Đã sao chép ${label.toLowerCase()}.`);
    });
  }

  return (
    <div className={styles.field}>
      <span className={styles["field-label"]}>{label}</span>
      <div className={styles["field-row"]}>
        <span className={styles["field-value"]}>{value}</span>
        <button type="button" className={styles.copy} aria-label={`Sao chép ${label}`} onClick={handleCopy}>
          <FontAwesomeIcon icon={faCopy} />
        </button>
      </div>
    </div>
  );
}

function CheckoutPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { activatePremium } = useAuth();
  const [plan, setPlan] = useState(null);
  const [order, setOrder] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [planReady, setPlanReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPlanReady(false);

    loadPlanById(planId)
      .then((loadedPlan) => {
        if (!cancelled) {
          setPlan(loadedPlan);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPlan(null);
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

  useEffect(() => {
    if (!plan) return undefined;

    let cancelled = false;

    createCheckoutOrder(plan.id)
      .then((createdOrder) => {
        if (!cancelled) {
          setOrder(createdOrder);
          if (createdOrder?.orderId) {
            saveCheckoutSession({
              planId: plan.id,
              orderId: createdOrder.orderId,
              payOsOrderCode: createdOrder.payOsOrderCode,
              checkoutUrl: createdOrder.checkoutUrl,
            });
          }
          if (createdOrder?.expiredAt) {
            setSecondsLeft(resolveSecondsUntil(createdOrder.expiredAt));
          }
        }
      })
      .catch((error) => {
        if (!cancelled) {
          showToast(error?.message ?? "Không tạo được đơn thanh toán.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [plan, showToast]);

  useEffect(() => {
    if (!order?.orderId || order.status === "Paid") {
      return undefined;
    }

    const interval = window.setInterval(async () => {
      try {
        const updated = await getCheckoutOrder(order.orderId);
        if (!updated) return;

        setOrder((prev) => ({
          ...updated,
          checkoutUrl: updated.checkoutUrl ?? prev?.checkoutUrl ?? null,
        }));
        if (updated.expiredAt) {
          setSecondsLeft(resolveSecondsUntil(updated.expiredAt));
        }

        if (updated.status === "Paid") {
          await activatePremium();
          clearCheckoutSession();
          navigate(`/home/premium/success/${plan.id}`, {
            replace: true,
            state: {
              orderId: updated.orderId,
              transactionId: updated.payOsOrderCode,
              activated: true,
            },
          });
        }
      } catch {
        /* keep polling */
      }
    }, 3000);

    return () => window.clearInterval(interval);
  }, [activatePremium, navigate, order?.orderId, order?.status, plan?.id]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const transferContent = useMemo(
    () => (order?.payOsOrderCode ? order.payOsOrderCode : buildTransferContent(plan?.id ?? planId)),
    [order?.payOsOrderCode, plan?.id, planId],
  );
  const checkout = plan?.checkout;

  function handleOpenBankApp() {
    if (order?.checkoutUrl) {
      window.open(order.checkoutUrl, "_blank", "noreferrer");
      showToast("Hoàn tất thanh toán trên PayOS. Premium kích hoạt sau khi webhook xác nhận.");
      return;
    }

    if (USE_MOCK) {
      navigate(`/home/premium/success/${plan.id}`, {
        state: {
          orderId: order?.orderId ?? null,
          transactionId: order?.payOsOrderCode ?? buildTransactionId(),
          mockConfirm: !order?.orderId,
        },
      });
      return;
    }

    showToast("Chưa có link PayOS. Vui lòng quét mã QR hoặc chuyển khoản theo thông tin đơn.");
  }

  if (!planReady) {
    return null;
  }

  if (!planId || !plan || !PRICING_PLANS.some((item) => item.id === planId)) {
    return <Navigate to="/home/premium" replace />;
  }

  const displayAmount = order?.amount ?? checkout.totalPrice;

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <Link to="/home/premium" className={styles.back}>
          <FontAwesomeIcon icon={faArrowLeft} />
          Quay lại
        </Link>
        <span className={styles["secure-badge"]}>
          <FontAwesomeIcon icon={faShieldHalved} />
          Cổng thanh toán an toàn
        </span>
      </div>

      <header className={styles.header}>
        <h1 className={styles.title}>Hoàn tất thanh toán Premium</h1>
        <p className={styles.subtitle}>
          Mở khóa toàn bộ tính năng học tập nâng cao dành cho thành viên SEHub.
        </p>
      </header>

      <div className={styles.layout}>
        <section className={styles.summary} aria-label="Chi tiết đơn hàng">
          <h2 className={styles["summary-title"]}>Chi tiết đơn hàng</h2>

          <div className={styles.package}>
            <div className={styles["package-head"]}>
              <div>
                <p className={styles["package-name"]}>{checkout.packageTitle}</p>
                <p className={styles["package-desc"]}>{checkout.tagline}</p>
              </div>
              <span className={styles["package-badge"]}>Premium</span>
            </div>

            <dl className={styles.breakdown}>
              <div className={styles.row}>
                <dt>Giá gốc</dt>
                <dd>{formatVnd(checkout.originalPrice)}</dd>
              </div>
              {checkout.savingsAmount > 0 && (
                <div className={styles.row}>
                  <dt>Ưu đãi SEHub</dt>
                  <dd className={styles.discount}>
                    - {formatVnd(checkout.savingsAmount)}
                    {checkout.savingsLabel ? ` (${checkout.savingsLabel})` : ""}
                  </dd>
                </div>
              )}
              <div className={styles.row}>
                <dt>Chi tiết</dt>
                <dd>
                  {formatVnd(checkout.monthlyPrice)}/tháng x {checkout.months}
                </dd>
              </div>
            </dl>

            <div className={styles.total}>
              <span>Tổng thanh toán</span>
              <strong>{formatVnd(displayAmount)}</strong>
            </div>
          </div>

          <div className={styles.note}>
            <FontAwesomeIcon icon={faLock} />
            Thanh toán an toàn với PayOS
          </div>
        </section>

        <section className={styles.gateway} aria-label="Cổng thanh toán">
          <div className={styles["gateway-header"]}>
            <span>Cổng thanh toán trực tuyến</span>
            <span className={styles.timer}>{formatTimer(secondsLeft)}</span>
          </div>

          <div className={styles["gateway-body"]}>
            <div className={styles.qr}>
              <div className={styles.phone}>
                <div className={styles["qr-box"]}>
                  <PaymentQrCode qrValue={order?.qrUrl} checkoutUrl={order?.checkoutUrl} />
                </div>
              </div>
              <p>Quét mã QR bằng ứng dụng Ngân hàng hoặc Ví điện tử</p>
            </div>

            <div className={styles.transfer}>
              <CopyField label="Ngân hàng" value={PAYMENT_INFO.bank} />
              <CopyField label="Số tài khoản" value={PAYMENT_INFO.accountNumber} />
              <CopyField label="Tên tài khoản" value={PAYMENT_INFO.accountName} />
              <CopyField label="Nội dung" value={transferContent} />
            </div>
          </div>

          <div className={styles.actions}>
            <Button fullWidth onClick={handleOpenBankApp}>
              Mở ứng dụng ngân hàng
            </Button>
            <button type="button" className={styles.cancel} onClick={() => navigate("/home/premium")}>
              Hủy thanh toán
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default CheckoutPage;
