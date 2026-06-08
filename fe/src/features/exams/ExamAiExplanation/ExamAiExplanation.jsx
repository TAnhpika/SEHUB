import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context";
import { getAiExplanation } from "@/features/exams/examAiExplainData";
import ExamAiChat from "@/features/exams/ExamAiChat/ExamAiChat";
import {
  canUseExamAiChat,
  getExamAiAccess,
  shouldAutoRevealAiExplanation,
} from "@/utils/examAccess";
import styles from "./ExamAiExplanation.module.css";

function ExamAiExplanation({ examId, question }) {
  const { user, isAuthenticated, isPremium, aiTokens, spendAiExplainTokens } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const aiAccess = getExamAiAccess(user);
  const showPremiumChat = canUseExamAiChat(user);

  useEffect(() => {
    setRevealed(shouldAutoRevealAiExplanation(user));
    setRefreshKey(0);
  }, [question?.id, user?.username, user?.plan, user?.role]);

  function handleReveal() {
    const result = spendAiExplainTokens();
    if (result.ok) {
      setRevealed(true);
    }
  }

  function handleRefresh() {
    const result = spendAiExplainTokens();
    if (result.ok) {
      setRefreshKey((key) => key + 1);
    }
  }

  function renderPremiumChat() {
    if (!showPremiumChat) return null;
    return <ExamAiChat examId={examId} question={question} />;
  }

  if (aiAccess.status === "guest") {
    return (
      <section className={styles.locked} aria-label="AI giải thích — cần đăng nhập">
        <div className={styles["locked-inner"]}>
          <FontAwesomeIcon icon={faRobot} className={styles["locked-icon"]} />
          <p className={styles["locked-title"]}>AI giải thích chi tiết</p>
          <p className={styles["locked-desc"]}>
            Đăng nhập để dùng AI giải thích đáp án. Tài khoản Basic được{" "}
            <strong>10 token/ngày</strong> (reset 00:00).
          </p>
          <Link to="/login" className={styles.cta}>
            Đăng nhập
          </Link>
        </div>
      </section>
    );
  }

  if (aiAccess.status === "exhausted" && !revealed) {
    return (
      <div className={styles.stack}>
        <section className={styles.locked} aria-label="AI giải thích — hết token">
          <div className={styles["locked-inner"]}>
            <FontAwesomeIcon icon={faRobot} className={styles["locked-icon"]} />
            <p className={styles["locked-title"]}>Đã hết token AI hôm nay</p>
            <p className={styles["locked-desc"]}>
              Bạn đã dùng {aiTokens.used}/{aiTokens.limit} token. Token reset lúc 00:00.
              {!isPremium && " Nâng cấp Premium để có 1.000 token/ngày."}
            </p>
            {!isPremium ? (
              <Link to="/home/premium" className={styles.cta}>
                Xem gói Premium
              </Link>
            ) : null}
          </div>
        </section>
        {renderPremiumChat()}
      </div>
    );
  }

  if (!revealed) {
    return (
      <div className={styles.stack}>
        <section className={styles.prompt} aria-label="AI giải thích chi tiết">
          <div className={styles["prompt-inner"]}>
            <FontAwesomeIcon icon={faRobot} className={styles["prompt-icon"]} />
            <div>
              <p className={styles["prompt-title"]}>AI giải thích chi tiết</p>
              <p className={styles["prompt-desc"]}>
                Mỗi lần giải thích tốn <strong>{aiTokens.cost} token</strong>. Còn lại hôm nay:{" "}
                <strong>{aiTokens.remaining}</strong>/{aiTokens.limit}.
              </p>
            </div>
            <button type="button" className={styles["prompt-btn"]} onClick={handleReveal}>
              Giải thích bằng AI
            </button>
          </div>
        </section>
        {renderPremiumChat()}
      </div>
    );
  }

  const explanation = getAiExplanation(question);

  return (
    <section className={styles.panel} aria-label="AI giải thích chi tiết" key={refreshKey}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.icon} aria-hidden="true">
            <FontAwesomeIcon icon={faRobot} />
          </span>
          <div>
            <h3 className={styles.title}>AI giải thích chi tiết</h3>
            {isAuthenticated && Number.isFinite(aiTokens.remaining) ? (
              <p className={styles["token-meta"]}>
                Token còn lại: {aiTokens.remaining}/{aiTokens.limit}
              </p>
            ) : null}
          </div>
        </div>
        <button type="button" className={styles.refresh} onClick={handleRefresh}>
          Yêu cầu giải thích lại
        </button>
      </header>

      <p className={styles.intro}>{explanation.intro}</p>

      <ul className={styles.bullets}>
        {explanation.bullets.map((item) => (
          <li key={item.label}>
            <strong>{item.label}</strong>: {item.text}
          </li>
        ))}
      </ul>

      <p className={styles.note}>{explanation.note}</p>

      {renderPremiumChat()}
    </section>
  );
}

export default ExamAiExplanation;
