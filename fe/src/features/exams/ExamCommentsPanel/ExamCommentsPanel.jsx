import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context";
import { useToast } from "@/common/Toast/ToastProvider";
import UserReportButton from "@/features/reports/UserReportButton/UserReportButton";
import {
  addExamComment,
  loadExamComments,
  toggleExamCommentLike,
} from "@/features/exams/examCommentsStore";
import { EXAM_USE_MOCK } from "@/features/exams/examDetailData";
import styles from "./ExamCommentsPanel.module.css";

function ExamCommentsPanel({ locked = false, reason = "premium", examId, questionId, questionLabel }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [draft, setDraft] = useState("");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (locked || !examId || questionId == null) {
      setComments([]);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    loadExamComments(examId, questionId)
      .then((items) => {
        if (!cancelled) {
          setComments(items);
          setDraft("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setComments([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [locked, examId, questionId]);

  if (locked) {
    return (
      <aside className={styles.locked} aria-label="Bình luận — Premium">
        <h3 className={styles.title}>Bình luận</h3>
        <p className={styles["locked-text"]}>
          {reason === "guest"
            ? "Đăng nhập và nâng cấp Premium để thảo luận trực tiếp dưới từng câu hỏi."
            : "Bình luận câu hỏi chỉ dành cho tài khoản Premium."}
        </p>
        <Link to={reason === "guest" ? "/login" : "/home/premium"} className={styles.cta}>
          {reason === "guest" ? "Đăng nhập" : "Xem gói Premium"}
        </Link>
      </aside>
    );
  }

  async function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed) {
      showToast("Vui lòng nhập nội dung bình luận.");
      return;
    }

    try {
      await addExamComment(examId, questionId, user, trimmed);
      const next = await loadExamComments(examId, questionId);
      setComments(next);
      setDraft("");
      showToast("Đã đăng bình luận.");
    } catch (error) {
      showToast(error?.message ?? "Không gửi được bình luận.");
    }
  }

  async function handleLike(commentId) {
    if (!EXAM_USE_MOCK) return;
    const next = await toggleExamCommentLike(examId, questionId, commentId, user?.username);
    setComments(next);
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

      {loading ? <p className={styles.empty}>Đang tải bình luận…</p> : null}

      <ul className={styles.list}>
        {comments.map((comment) => {
          const isOwn =
            Boolean(user?.username && comment.username && user.username === comment.username);

          return (
          <li key={comment.id} className={styles.item}>
            <div className={styles.avatar} style={{ backgroundColor: comment.avatarColor }}>
              {comment.initial}
            </div>
            <div className={styles.body}>
              <div className={styles.meta}>
                <strong>{comment.author}</strong>
                <span>{comment.timeAgo}</span>
              </div>
              <p className={styles.content}>{comment.content}</p>
              <div className={styles.actions}>
                {EXAM_USE_MOCK ? (
                  <button type="button" className={styles.like} onClick={() => handleLike(comment.id)}>
                    <FontAwesomeIcon icon={faHeart} />
                    {comment.likes > 0 ? comment.likes : ""}
                  </button>
                ) : null}
                {comment.userId && !isOwn ? (
                  <UserReportButton
                    userId={comment.userId}
                    username={comment.username || comment.author}
                    source="question_comment"
                    examId={examId}
                    questionId={questionId}
                    questionCommentId={comment.id}
                    className={styles.report}
                    label="Báo cáo người dùng"
                  />
                ) : null}
              </div>
            </div>
          </li>
          );
        })}
        {!loading && comments.length === 0 ? (
          <li className={styles.empty}>Chưa có bình luận — hãy là người đầu tiên.</li>
        ) : null}
      </ul>

      <div className={styles.composer}>
        <textarea
          className={styles.input}
          rows={2}
          placeholder="Viết bình luận của bạn..."
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="button" className={styles.send} onClick={handleSend}>
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </div>
    </aside>
  );
}

export default ExamCommentsPanel;
