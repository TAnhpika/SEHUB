import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faExternalLinkAlt,
  faLock,
  faQrcode,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import * as premiumApi from "@/api/premiumApi";
import {
  formatVnd,
  getPlanById,
} from "@/features/landing/PricingModal/pricingData";
import { getBePlanCode, isValidFePlanId } from "@/features/premium/premiumPlanMap";
import styles from "./CheckoutPage.module.css";

const POLL_INTERVAL_MS = 3000;

function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

function formatTimer(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function secondsUntil(isoDate) {
  const target = new Date(isoDate).getTime();
  const diff = Math.floor((target - Date.now()) / 1000);
  return Math.max(0, diff);
}

function CheckoutPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const plan = useMemo(() => getPlanById(planId), [planId]);
  const checkout = plan.checkout;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const pollRef = useRef(null);

  const goToSuccess = useCallback(
    (paymentOrder) => {
      navigate(`/home/premium/success/${planId}`, {
        replace: true,
        state: {
          orderId: paymentOrder.orderId,
          payOsOrderCode: paymentOrder.payOsOrderCode,
          amount: paymentOrder.amount,
        },
      });
    },
    [navigate, planId],
  );

  const checkOrderStatus = useCallback(
    async (orderId) => {
      const latest = await premiumApi.getOrder(orderId);
      setOrder(latest);
      if (latest.status === "Paid") {
        goToSuccess(latest);
      }
      return latest;
    },
    [goToSuccess],
  );

  useEffect(() => {
    if (!isValidFePlanId(planId)) {
      return undefined;
    }

    let cancelled = false;

    async function initOrder() {
      setLoading(true);
      try {
        const created = await premiumApi.createOrder({
          planCode: getBePlanCode(planId),
        });
        if (cancelled) return;
        setOrder(created);
        setSecondsLeft(secondsUntil(created.expiredAt));
      } catch (error) {
        if (!cancelled) {
          showToast(error?.message ?? "Không tạo được đơn thanh toán.");
          navigate("/home/premium", { replace: true });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    initOrder();

    return () => {
      cancelled = true;
    };
  }, [planId, navigate, showToast]);

  useEffect(() => {
    if (!order?.orderId || order.status === "Paid") {
      return undefined;
    }

    pollRef.current = window.setInterval(() => {
      checkOrderStatus(order.orderId).catch(() => {});
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
      }
    };
  }, [order?.orderId, order?.status, checkOrderStatus]);

  useEffect(() => {
    if (!order?.expiredAt) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft(secondsUntil(order.expiredAt));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [order?.expiredAt]);

  async function handleOpenPayOs() {
    if (!order?.checkoutUrl) {
      showToast("Chưa có liên kết thanh toán PayOS.");
      return;
    }
    window.open(order.checkoutUrl, "_blank", "noopener,noreferrer");
  }

  async function handleDevConfirm() {
    if (!order?.orderId) return;
    setConfirming(true);
    try {
      const paid = await premiumApi.confirmDevPayment(order.orderId);
      goToSuccess(paid);
    } catch (error) {
      showToast(error?.message ?? "Xác nhận thanh toán thất bại.");
      setConfirming(false);
    }
  }

  if (!isValidFePlanId(planId)) {
    return <Navigate to="/home/premium" replace />;
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.loading}>Đang tạo đơn thanh toán...</p>
      </div>
    );
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
          Thanh toán qua PayOS để kích hoạt gói Premium trên tài khoản của bạn.
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
                <dt>Mã đơn PayOS</dt>
                <dd>{order?.payOsOrderCode ?? "—"}</dd>
              </div>
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
                  {order?.qrUrl && isHttpUrl(order.qrUrl) ? (
                    <img src={order.qrUrl} alt="Mã QR PayOS" className={styles["qr-image"]} />
                  ) : (
                    <FontAwesomeIcon icon={faQrcode} className={styles["qr-icon"]} />
                  )}
                </div>
              </div>
              <p>Quét mã QR hoặc mở trang PayOS để thanh toán</p>
            </div>

            {order?.checkoutUrl && (
              <p className={styles.payosLink}>
                <a href={order.checkoutUrl} target="_blank" rel="noopener noreferrer">
                  {order.checkoutUrl}
                </a>
              </p>
            )}
          </div>

          <div className={styles.actions}>
            <Button fullWidth onClick={handleOpenPayOs} disabled={!order?.checkoutUrl}>
              <FontAwesomeIcon icon={faExternalLinkAlt} />
              Thanh toán qua PayOS
            </Button>
            {import.meta.env.DEV && (
              <Button
                fullWidth
                look="outline"
                onClick={handleDevConfirm}
                disabled={confirming || order?.status === "Paid"}
              >
                {confirming ? "Đang xác nhận..." : "Xác nhận thanh toán (Dev)"}
              </Button>
            )}
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
