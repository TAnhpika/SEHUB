import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faClock,
  faRocket,
  faStar,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import Button from "@/common/Button/Button";
import { useAuth } from "@/context";
import { useToast } from "@/common/Toast/ToastProvider";
import { ApiError } from "@/api/httpClient";
import {
  FEATURE_COMPARISON,
  loadPricingPlans,
  loadSubscriptionStatus,
  PRICING_PLANS,
  requestPremiumRefund,
} from "@/features/landing/PricingModal/pricingData";
import PremiumRefundModal from "@/features/premium/PremiumRefundModal/PremiumRefundModal";
import {
  formatPremiumStatusSummary,
  isPremiumExpiringSoon,
} from "@/utils/premiumSubscription";
import styles from "./PricingContent.module.css";

function ComparisonCell({ value }) {
  if (value.type === "check") {
    return (
      <span className={styles.check} aria-label="Có">
        <FontAwesomeIcon icon={faCheck} />
      </span>
    );
  }

  if (value.type === "cross") {
    return (
      <span className={styles.cross} aria-label="Không">
        <FontAwesomeIcon icon={faXmark} />
      </span>
    );
  }

  return (
    <span
      className={`${styles["cell-label"]} ${value.highlight ? styles["cell-label-highlight"] : ""}`}
    >
      {value.text}
    </span>
  );
}

function PricingContent({ requireLogin = false, onGuestRedirect }) {
  const navigate = useNavigate();
  const { showCountdownToast, showToast } = useToast();
  const { isPremium, user } = useAuth();
  const [plans, setPlans] = useState(PRICING_PLANS);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundError, setRefundError] = useState("");
  const [refundSubmitting, setRefundSubmitting] = useState(false);

  useEffect(() => {
    loadPricingPlans()
      .then(setPlans)
      .catch(() => {
        setPlans(PRICING_PLANS);
      });
  }, []);

  useEffect(() => {
    if (requireLogin) {
      return undefined;
    }

    let cancelled = false;

    loadSubscriptionStatus()
      .then((status) => {
        if (!cancelled) {
          setSubscriptionStatus(status);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSubscriptionStatus(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [requireLogin, isPremium, user?.premiumExpiresAt]);

  const premiumSummary = formatPremiumStatusSummary({
    isActive: Boolean(subscriptionStatus?.isActive ?? isPremium),
    expiresAt: subscriptionStatus?.expiresAt ?? user?.premiumExpiresAt ?? null,
  });
  const showPremiumBanner = Boolean(premiumSummary);
  const expiringSoon = isPremiumExpiringSoon(
    subscriptionStatus?.expiresAt ?? user?.premiumExpiresAt ?? null,
  );
  const renewPlanId = plans.find((plan) => plan.popular)?.id ?? plans[0]?.id ?? "monthly";
  const canRequestRefund = Boolean(
    !requireLogin &&
      subscriptionStatus?.canRequestRefund &&
      subscriptionStatus?.latestPaidOrderCode,
  );
  const hasPendingRefundRequest = Boolean(subscriptionStatus?.hasPendingRefundRequest);

  async function refreshSubscriptionStatus() {
    try {
      const status = await loadSubscriptionStatus();
      setSubscriptionStatus(status);
      return status;
    } catch {
      setSubscriptionStatus(null);
      return null;
    }
  }

  async function handleRefundSubmit({ reason }) {
    const orderCode = subscriptionStatus?.latestPaidOrderCode;
    if (!orderCode) {
      setRefundError("Không tìm thấy mã đơn thanh toán.");
      return;
    }

    setRefundError("");
    setRefundSubmitting(true);

    try {
      const result = await requestPremiumRefund({ orderCode, reason });
      setRefundOpen(false);
      showToast(result.message ?? "Yêu cầu hoàn tiền đã được gửi.");
      await refreshSubscriptionStatus();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Không gửi được yêu cầu hoàn tiền. Vui lòng thử lại.";
      setRefundError(message);
    } finally {
      setRefundSubmitting(false);
    }
  }

  function handleGuestPlanSelect(planId) {
    const checkoutPath = `/home/premium/checkout/${planId}`;

    // Landing = luôn yêu cầu đăng nhập, không nhảy checkout dù còn session cũ trong localStorage
    showCountdownToast(
      "Vui lòng đăng nhập để chọn gói Premium.",
      () => {
        onGuestRedirect?.();
        navigate("/login", { state: { from: checkoutPath } });
      },
      () => {},
    );
  }

  return (
    <>
      {showPremiumBanner && (
        <div
          className={`${styles["premium-banner"]} ${expiringSoon ? styles["premium-banner-warning"] : ""}`}
          role="status"
        >
          <div className={styles["premium-banner-text"]}>
            <FontAwesomeIcon icon={faClock} className={styles["premium-banner-icon"]} />
            <div className={styles["premium-banner-copy"]}>
              <span>{premiumSummary}</span>
              {hasPendingRefundRequest ? (
                <span className={styles["premium-refund-pending"]}>
                  Yêu cầu hoàn tiền đang chờ admin duyệt — gói Premium vẫn hoạt động.
                </span>
              ) : null}
            </div>
          </div>
          {!requireLogin && (
            <div className={styles["premium-banner-actions"]}>
              {canRequestRefund ? (
                <Button
                  look="outline"
                  type="button"
                  className={styles["premium-refund-btn"]}
                  onClick={() => {
                    setRefundError("");
                    setRefundOpen(true);
                  }}
                >
                  Yêu cầu hoàn tiền
                </Button>
              ) : null}
              <Button
                look="primary"
                type="button"
                to={`/home/premium/checkout/${renewPlanId}`}
                className={styles["premium-renew-btn"]}
              >
                Gia hạn Premium
              </Button>
            </div>
          )}
        </div>
      )}

      <PremiumRefundModal
        open={refundOpen}
        orderCode={subscriptionStatus?.latestPaidOrderCode ?? null}
        lastPaidAt={subscriptionStatus?.lastPaidAt ?? null}
        error={refundError}
        submitting={refundSubmitting}
        onClose={() => {
          if (refundSubmitting) return;
          setRefundOpen(false);
          setRefundError("");
        }}
        onSubmit={handleRefundSubmit}
      />

      <div className={styles.header}>
        <span className={styles.badge}>
          <FontAwesomeIcon icon={faRocket} />
          Nâng cấp tài khoản
        </span>
        <h1 id="pricing-modal-title" className={styles.title}>
          Chọn gói phù hợp dành cho bạn
        </h1>
        <p className={styles.subtitle}>
          Mở khóa toàn bộ đáp án đề thi, tài liệu học tập và trợ lý AI không giới hạn để
          tối ưu hóa quá trình ôn luyện của bạn.
        </p>
      </div>

      <div className={styles.plans}>
        {plans.map((plan) => (
          <article
            key={plan.id}
            className={`${styles.plan} ${plan.popular ? styles["plan-popular"] : ""}`}
          >
            {plan.popular && (
              <span className={styles["popular-badge"]}>
                <FontAwesomeIcon icon={faStar} />
                PHỔ BIẾN NHẤT
              </span>
            )}

            <div className={styles["plan-head"]}>
              <div className={styles["plan-title-row"]}>
                <h2 className={styles["plan-name"]}>{plan.name}</h2>
                {plan.savings && (
                  <span className={styles["savings-badge"]}>{plan.savings}</span>
                )}
              </div>
              <p className={styles["plan-duration"]}>{plan.duration}</p>
              <p className={styles["plan-price"]}>{plan.price}</p>
            </div>

            <ul className={styles["plan-features"]}>
              {plan.features.map((feature) => (
                <li key={feature}>
                  <FontAwesomeIcon icon={faCheck} className={styles["feature-icon"]} />
                  {feature}
                </li>
              ))}
            </ul>

            {requireLogin ? (
              <Button
                look={plan.ctaLook}
                fullWidth
                type="button"
                onClick={() => handleGuestPlanSelect(plan.id)}
                className={
                  plan.id === "full"
                    ? styles["plan-btn-outline"]
                    : plan.popular
                      ? styles["plan-btn-primary"]
                      : styles["plan-btn-muted"]
                }
              >
                {plan.cta}
              </Button>
            ) : (
              <Button
                look={plan.ctaLook}
                fullWidth
                to={`/home/premium/checkout/${plan.id}`}
                className={
                  plan.id === "full"
                    ? styles["plan-btn-outline"]
                    : plan.popular
                      ? styles["plan-btn-primary"]
                      : styles["plan-btn-muted"]
                }
              >
                {plan.cta}
              </Button>
            )}
          </article>
        ))}
      </div>

      <div className={styles.compare}>
        <h2 className={styles["compare-title"]}>So sánh chi tiết tính năng</h2>
        <div className={styles["compare-table"]} role="table">
          <div className={styles["compare-row"]} role="row">
            <span className={styles["compare-feature"]} role="columnheader">
              Tính năng
            </span>
            <span className={styles["compare-col"]} role="columnheader">
              Free
            </span>
            <span
              className={`${styles["compare-col"]} ${styles["compare-col-premium"]}`}
              role="columnheader"
            >
              Premium
            </span>
          </div>

          {FEATURE_COMPARISON.map((row) => (
            <div key={row.feature} className={styles["compare-row"]} role="row">
              <span className={styles["compare-feature"]} role="cell">
                {row.feature}
              </span>
              <span className={styles["compare-col"]} role="cell">
                <ComparisonCell value={row.free} />
              </span>
              <span
                className={`${styles["compare-col"]} ${styles["compare-col-premium"]}`}
                role="cell"
              >
                <ComparisonCell value={row.premium} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default PricingContent;
