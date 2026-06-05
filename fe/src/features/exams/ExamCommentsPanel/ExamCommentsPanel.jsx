import { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { MOCK_EXAM_COMMENTS } from "@/features/exams/examCommentsData";
import styles from "./ExamCommentsPanel.module.css";

function ExamCommentsPanel({ locked = false }) {
  const [draft, setDraft] = useState("");

  if (locked) {
    return (
      <aside className={styles.locked} aria-label="Bình luận — Premium">
        <h3 className={styles.title}>Bình luận</h3>
        <p className={styles["locked-text"]}>
          Đăng nhập và nâng cấp Premium để thảo luận trực tiếp dưới từng câu hỏi.
        </p>
        <Link to="/home/premium" className={styles.cta}>
          Xem gói Premium
        </Link>
      </aside>
    );
  }

  return (
    <aside className={styles.panel} aria-label="Bình luận">
      <header className={styles.header}>
        <div className={styles["title-row"]}>
          <h3 className={styles.title}>Bình luận</h3>
          <span className={styles.count}>{MOCK_EXAM_COMMENTS.length}</span>
        </div>
        <button type="button" className={styles["view-all"]}>
          Xem tất cả
        </button>
      </header>

      <ul className={styles.list}>
        {MOCK_EXAM_COMMENTS.map((comment) => (
          <li
            key={comment.id}
            className={`${styles.item} ${comment.highlighted ? styles["item-highlight"] : ""}`}
          >
            <div className={styles["item-head"]}>
              <span
                className={styles.avatar}
                style={{ background: comment.avatarColor }}
                aria-hidden="true"
              >
                {comment.initial}
              </span>
              <div>
                <p className={styles.author}>{comment.author}</p>
                <p className={styles.time}>{comment.timeAgo}</p>
              </div>
            </div>
            <p className={styles.content}>{comment.content}</p>
            <div className={styles.actions}>
              <button type="button" className={styles.like}>
                <FontAwesomeIcon icon={faHeart} />
                {comment.likes}
              </button>
              <button type="button" className={styles.reply}>
                Trả lời
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className={styles.composer}>
        <textarea
          className={styles.input}
          rows={3}
          placeholder="Viết bình luận của bạn..."
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="button" className={styles.send} aria-label="Gửi bình luận">
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </div>
    </aside>
  );
}

export default ExamCommentsPanel;
