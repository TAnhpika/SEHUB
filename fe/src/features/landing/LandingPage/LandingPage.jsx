import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faAward,
  faComments,
  faFileLines,
  faKey,
  faPaperPlane,
  faPlay,
  faRobot,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import PricingModal from "@/features/landing/PricingModal/PricingModal";
import { getPlanById } from "@/features/landing/PricingModal/pricingData";
import logoSrc from "@/img/logo.png";
import styles from "./LandingPage.module.css";

const SEMESTER_PLAN = getPlanById("semester");

const FEATURES = [
  {
    icon: faFileLines,
    iconClass: "icon-blue",
    title: "Kho đề thi",
    desc: "Truy cập hàng ngàn đề thi cuối kỳ và giữa kỳ được phân loại theo môn học và giảng viên.",
  },
  {
    icon: faComments,
    iconClass: "icon-blue",
    title: "Cộng đồng",
    desc: "Kết nối và học hỏi từ hàng ngàn sinh viên IT khác. Đặt câu hỏi và nhận giải đáp nhanh.",
  },
  {
    icon: faRobot,
    iconClass: "icon-purple",
    title: "AI giải đáp",
    desc: "Trợ lý AI thông minh giúp giải bài tập, giải thích code và tóm tắt tài liệu chính xác.",
  },
  {
    icon: faKey,
    iconClass: "icon-amber",
    title: "Gamification",
    desc: "Học tập không còn nhàm chán với hệ thống điểm thưởng, cấp độ và huy hiệu ghi nhận nỗ lực.",
  },
];

const STATS = [
  { value: "500+", label: "Bộ đề cập nhật" },
  { value: "2.000+", label: "Sinh viên" },
  { value: "300+", label: "Tài liệu" },
  { value: "26", label: "Kết nối" },
];

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function LandingPage() {
  const [pricingOpen, setPricingOpen] = useState(false);

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles["hero-glow"]} aria-hidden="true" />

        <div className={styles["hero-inner"]}>
          <div className={styles["hero-copy"]}>
            <span className={styles.badge}>
              <span className={styles["badge-dot"]} aria-hidden="true" />
              Version 2.0 đã ra mắt
            </span>
            <h1 id="hero-title" className={styles["hero-title"]}>
              Ôn thi, chia sẻ, kết nối cùng{" "}
              <span className={styles["hero-accent"]}>cộng đồng SE</span>
            </h1>
            <p className={styles["hero-desc"]}>
              Kho đề thi, tài liệu học tập, cộng đồng bài viết và AI giải đáp — tất cả trong
              một nền tảng được thiết kế chuyên biệt cho sinh viên IT.
            </p>
            <div className={styles["hero-actions"]}>
              <Button to="/register" size="lg" className={styles["btn-primary-round"]}>
                Đăng ký miễn phí
                <FontAwesomeIcon icon={faArrowRight} />
              </Button>
              <Button
                look="outline"
                size="lg"
                className={styles["btn-outline-round"]}
                onClick={() => scrollToSection("features")}
              >
                <FontAwesomeIcon icon={faPlay} />
                Xem chi tiết
              </Button>
            </div>
          </div>

          <div className={styles["hero-visual"]} aria-hidden="true">
            <span className={styles["points-badge"]}>
              <FontAwesomeIcon icon={faTrophy} />
              +50 Điểm
            </span>

            <div className={styles["chat-card"]}>
              <div className={styles["chat-header"]}>
                <img
                  src={logoSrc}
                  alt=""
                  className={styles["chat-avatar"]}
                  decoding="async"
                  aria-hidden="true"
                />
                <div className={styles["chat-header-text"]}>
                  <p className={styles["chat-name"]}>AI Trợ Giảng</p>
                  <p className={styles["chat-status"]}>Đang trực tuyến</p>
                </div>
                <span className={styles["status-dot"]} title="Đang trực tuyến" />
              </div>

              <div className={styles["chat-body"]}>
                <div className={styles["chat-bubble-user"]}>
                  <p>Giải thích thuật toán Dijkstra một cách đơn giản?</p>
                </div>
                <div className={styles["chat-bubble-ai"]}>
                  <p>
                    Dijkstra tìm đường đi ngắn nhất từ một đỉnh đến các đỉnh còn lại bằng cách
                    luôn chọn đỉnh gần nhất chưa duyệt...
                  </p>
                </div>
              </div>

              <div className={styles["chat-input-wrap"]}>
                <span className={styles["chat-input"]}>Hỏi AI bất kỳ điều gì...</span>
                <span className={styles["chat-send"]}>
                  <FontAwesomeIcon icon={faPaperPlane} />
                </span>
              </div>
            </div>

            <span className={styles["exam-badge"]}>Ôn thi cùng AI</span>
          </div>
        </div>
      </section>

      <section id="features" className={styles.features}>
        <div className={styles["section-wrap"]}>
          <h2 className={styles["section-title"]}>Hệ sinh thái học tập toàn diện</h2>
          <p className={styles["section-desc"]}>
            Công cụ mạnh mẽ giúp bạn tối ưu hóa thời gian và nâng cao hiệu suất học tập.
          </p>
          <div className={styles["features-grid"]}>
            {FEATURES.map((item) => (
              <article key={item.title} className={styles["feature-card"]}>
                <div className={`${styles["feature-icon"]} ${styles[item.iconClass]}`}>
                  <FontAwesomeIcon icon={item.icon} />
                </div>
                <h3 className={styles["feature-title"]}>{item.title}</h3>
                <p className={styles["feature-desc"]}>{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.stats} aria-label="Thống kê">
        <div className={styles["stats-grid"]}>
          {STATS.map((item) => (
            <article key={item.label} className={styles["stat-card"]}>
              <p className={styles["stat-value"]}>{item.value}</p>
              <p className={styles["stat-label"]}>{item.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="community" className={styles.premium}>
        <div className={styles["section-wrap"]}>
          <h2 className={styles["section-title"]}>Đầu tư cho tương lai</h2>
          <p className={styles["section-desc"]}>
            Chọn gói phù hợp với nhu cầu học tập của bạn.
          </p>
          <div className={styles["premium-banner"]}>
            <div className={styles["premium-info"]}>
              <div className={styles["premium-icon-wrap"]}>
                <FontAwesomeIcon icon={faAward} />
              </div>
              <div>
                <h3 className={styles["premium-name"]}>Nâng cấp Premium</h3>
                <p className={styles["premium-tagline"]}>
                  Xem full đáp án, tài liệu, AI không giới hạn
                </p>
              </div>
            </div>
            <div className={styles["premium-side"]}>
              <div className={styles["premium-tags"]}>
                <span className={styles["tag-outline"]}>Từ 48K/tháng</span>
                <span className={styles["tag-filled"]}>
                  {SEMESTER_PLAN.savings} — {SEMESTER_PLAN.name}
                </span>
              </div>
              <Button className={styles["premium-btn"]} onClick={() => setPricingOpen(true)}>
                Xem gói ngay
                <FontAwesomeIcon icon={faArrowRight} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div id="support" className={styles["anchor-target"]} aria-hidden="true" />

      <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
    </div>
  );
}

export default LandingPage;
