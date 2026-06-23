import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context";
import { useToast } from "@/common/Toast/ToastProvider";
import {
  addExamComment,
  getExamComments,
  toggleExamCommentLike,
} from "@/features/exams/examCommentsStore";
import styles from "./ExamCommentsPanel.module.css";

function ExamCommentsPanel({ locked = false, reason = "premium", examId, questionId, questionLabel }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [draft, setDraft] = useState("");
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (locked || !examId || questionId == null) {
      setComments([]);
      return;
    }
    setComments(getExamComments(examId, questionId));
    setDraft("");
  }, [locked, examId, questionId]);

  if (locked) {
    return (
      <aside className={styles.locked} aria-label="Bình luận — Premium">
        <h3 className={styles.title}>Bình luận</h3>
        <p className={styles["locked-text"]}>
          {reason === "guest"
            ? "Đăng nhập và nâng cấp Premium để thảo luận trực tiếp dưới từng câu hỏi (§3.3)."
            : "Bình luận câu hỏi chỉ dành cho tài khoản Premium (§2.3)."}
        </p>
        <Link to={reason === "guest" ? "/login" : "/home/premium"} className={styles.cta}>
          {reason === "guest" ? "Đăng nhập" : "Xem gói Premium"}
        </Link>
      </aside>
    );
  }

  function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed) {
      showToast("Vui lòng nhập nội dung bình luận.");
      return;
    }

    const comment = addExamComment(examId, questionId, user, trimmed);
    if (!comment) return;

    setComments(getExamComments(examId, questionId));
    setDraft("");
    showToast("Đã đăng bình luận.");
  }

  function handleLike(commentId) {
    toggleExamCommentLike(examId, questionId, commentId, user?.username);
    setComments(getExamComments(examId, questionId));
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <aside className={styles.panel} aria-label="Bình luận">
      <header className={styles.header}>
        <div className={styles["title-row"]}>
          <h3 className={styles.title}>
            Bình luận
            {questionLabel ? <span className={styles["question-tag"]}> · {questionLabel}</span> : null}
          </h3>
          <span className={styles.count}>{comments.length}</span>
        </div>
      </header>

      <ul className={styles.list}>
        {comments.map((comment) => (
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
              <button
                type="button"
                className={`${styles.like} ${comment.likedByMe ? styles["like-active"] : ""}`}
                onClick={() => handleLike(comment.id)}
              >
                <FontAwesomeIcon icon={faHeart} />
                {comment.likes}
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
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className={styles.send}
          onClick={handleSend}
          disabled={!draft.trim()}
          aria-label="Gửi bình luận"
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </div>
    </aside>
  );
}

export default ExamCommentsPanel;
