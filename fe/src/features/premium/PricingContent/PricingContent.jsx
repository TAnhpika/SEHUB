import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faRocket,
  faStar,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { FEATURE_COMPARISON, PRICING_PLANS } from "@/features/landing/PricingModal/pricingData";
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

function PricingContent() {
  return (
    <>
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
        {PRICING_PLANS.map((plan) => (
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
