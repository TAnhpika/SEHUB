import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAlignLeft,
  faArrowLeft,
  faBold,
  faCode,
  faHeart,
  faHighlighter,
  faImage,
  faItalic,
  faLink,
  faLinkSlash,
  faListOl,
  faListUl,
  faPaperclip,
  faQuoteLeft,
  faReply,
  faShareNodes,
  faStrikethrough,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context";
import { useToast } from "@/common/Toast/ToastProvider";
import { getPostById } from "@/features/feed/feedData";
import PostOwnerMenu from "@/features/feed/PostOwnerMenu/PostOwnerMenu";
import PostReportButton from "@/features/feed/PostReportButton/PostReportButton";
import { copyPostLink, isOwnComment, isOwnPost } from "@/features/feed/postUtils";
import styles from "./PostDetailPage.module.css";

function formatCommentTime(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

function formatShortDate(publishedAt) {
  if (!publishedAt) return "";
  const match = publishedAt.match(/(\d+)\s+tháng\s+(\d+),\s+(\d+)/);
  if (!match) return publishedAt;
  return `${match[1]}/${match[2]}/${match[3]}`;
}

function PostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showCopyToast } = useToast();

  const post = useMemo(() => getPostById(postId), [postId]);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentDraft, setEditCommentDraft] = useState("");

  useEffect(() => {
    if (!post) return;
    setLikes(post.likes);
    setLiked(false);
    setComments(post.commentsList ?? []);
    setDraft("");
    setEditingCommentId(null);
    setEditCommentDraft("");
  }, [post]);

  if (!post) {
    return <Navigate to="/home" replace />;
  }

  const isOwner = isOwnPost(post, user);
  const hasDraft = draft.trim().length > 0;
  const shortDate = formatShortDate(post.publishedAt);

  function handleLike() {
    setLiked((prev) => {
      setLikes((count) => (prev ? count - 1 : count + 1));
      return !prev;
    });
  }

  async function handleShare() {
    try {
      await copyPostLink(post.id);
      showCopyToast();
    } catch {
      showCopyToast();
    }
  }

  function handleSubmitComment() {
    const content = draft.trim();
    if (!content) return;

    setComments((prev) => [
      ...prev,
      {
        id: Date.now(),
        author: {
          name: user?.displayName ?? "Anhpika",
          initial: user?.initial ?? "A",
          username: user?.username,
        },
        time: formatCommentTime(new Date()),
        content,
      },
    ]);
    setDraft("");
  }

  function handleStartEditComment(comment) {
    setEditingCommentId(comment.id);
    setEditCommentDraft(comment.content);
  }

  function handleCancelEditComment() {
    setEditingCommentId(null);
    setEditCommentDraft("");
  }

  function handleSaveEditComment(commentId) {
    const content = editCommentDraft.trim();
    if (!content) return;

    setComments((prev) =>
      prev.map((item) => (item.id === commentId ? { ...item, content } : item)),
    );
    setEditingCommentId(null);
    setEditCommentDraft("");
  }

  function handleDeleteComment(commentId) {
    const confirmed = window.confirm("Bạn có chắc muốn xóa bình luận này?");
    if (!confirmed) return;

    setComments((prev) => prev.filter((item) => item.id !== commentId));
    if (editingCommentId === commentId) {
      setEditingCommentId(null);
      setEditCommentDraft("");
    }
  }

  return (
    <div className={styles.page}>
      <button type="button" className={styles.back} onClick={() => navigate(-1)}>
        <FontAwesomeIcon icon={faArrowLeft} />
        Quay lại
      </button>

      <article className={styles.card}>
        <div className={styles["card-head"]}>
          <p className={styles.summary}>
            <span className={styles.hash}>#</span> <strong>{post.title}</strong> {post.excerpt}
          </p>

          <div className={styles["meta-row"]}>
            <div className={styles.meta}>
              <span>{post.author.username}</span>
              <span aria-hidden="true">·</span>
              <span>{shortDate}</span>
              <span aria-hidden="true">·</span>
              <span>{likes} lượt thích</span>
              <span aria-hidden="true">·</span>
              <span>{comments.length} bình luận</span>
            </div>

            <div className={styles.actions}>
              {!isOwner && (
                <PostReportButton
                  postId={post.id}
                  postTitle={post.title}
                  className={`${styles.share} ${styles.report}`}
                />
              )}
              <button type="button" className={styles.share} aria-label="Chia sẻ" onClick={handleShare}>
                <FontAwesomeIcon icon={faShareNodes} />
              </button>
            </div>
          </div>
        </div>

        <h1 className={styles.title}>{post.title}</h1>
        <p className={styles.body}>{post.body ?? post.excerpt}</p>

        <div className={styles.helpful}>
          <span>Bài viết này có hữu ích không?</span>
          <button
            type="button"
            className={`${styles.like} ${liked ? styles["like-active"] : ""}`}
            onClick={handleLike}
          >
            <FontAwesomeIcon icon={faHeart} />
            {likes}
          </button>
        </div>
      </article>

      <section className={styles.comments} aria-label="Bình luận">
        <h2 className={styles["comments-title"]}>Bình luận ({comments.length})</h2>

        {comments.map((comment) => {
          const commentIsOwner = isOwnComment(comment, user);
          const isEditingComment = editingCommentId === comment.id;

          return (
            <article key={comment.id} className={styles.comment}>
              <div className={styles["comment-head"]}>
                <div className={styles["comment-author"]}>
                  <span className={styles["comment-avatar"]} aria-hidden="true">
                    {comment.author.initial}
                  </span>
                  <div>
                    <p className={styles["comment-name"]}>{comment.author.name}</p>
                    <p className={styles["comment-time"]}>{comment.time}</p>
                  </div>
                </div>

                {commentIsOwner && !isEditingComment && (
                  <PostOwnerMenu
                    horizontal
                    showDivider
                    editLabel="Sửa"
                    deleteLabel="Xóa"
                    menuAriaLabel="Tùy chọn bình luận"
                    onEdit={() => handleStartEditComment(comment)}
                    onDelete={() => handleDeleteComment(comment.id)}
                  />
                )}
              </div>

              {isEditingComment ? (
                <div className={styles["comment-edit"]}>
                  <textarea
                    className={styles["comment-edit-input"]}
                    value={editCommentDraft}
                    onChange={(event) => setEditCommentDraft(event.target.value)}
                    rows={3}
                  />
                  <div className={styles["comment-edit-actions"]}>
                    <button
                      type="button"
                      className={styles["comment-edit-save"]}
                      onClick={() => handleSaveEditComment(comment.id)}
                    >
                      Lưu
                    </button>
                    <button
                      type="button"
                      className={styles["comment-edit-cancel"]}
                      onClick={handleCancelEditComment}
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <p className={styles["comment-content"]}>{comment.content}</p>
              )}

              {!isEditingComment && (
                <button type="button" className={styles.reply}>
                  <FontAwesomeIcon icon={faReply} />
                  Trả lời
                </button>
              )}
            </article>
          );
        })}

        <div className={styles.editor}>
          <div className={styles["editor-panel"]}>
            <div className={styles.toolbar} aria-label="Định dạng bình luận">
              <button type="button" className={styles.tool} aria-label="In đậm">
                <FontAwesomeIcon icon={faBold} />
              </button>
              <button type="button" className={styles.tool} aria-label="In nghiêng">
                <FontAwesomeIcon icon={faItalic} />
              </button>
              <button type="button" className={styles.tool} aria-label="Gạch ngang">
                <FontAwesomeIcon icon={faStrikethrough} />
              </button>
              <button type="button" className={styles.tool} aria-label="Đánh dấu">
                <FontAwesomeIcon icon={faHighlighter} />
              </button>
              <button type="button" className={styles.tool} aria-label="Mã">
                <FontAwesomeIcon icon={faCode} />
              </button>
              <button type="button" className={styles.tool} aria-label="Liên kết">
                <FontAwesomeIcon icon={faLink} />
              </button>
              <button type="button" className={styles.tool} aria-label="Gỡ liên kết">
                <FontAwesomeIcon icon={faLinkSlash} />
              </button>
              <button type="button" className={styles.tool} aria-label="Hình ảnh">
                <FontAwesomeIcon icon={faImage} />
              </button>
              <button type="button" className={styles.tool} aria-label="Đính kèm">
                <FontAwesomeIcon icon={faPaperclip} />
              </button>
              <button type="button" className={styles.tool} aria-label="Danh sách">
                <FontAwesomeIcon icon={faListUl} />
              </button>
              <button type="button" className={styles.tool} aria-label="Danh sách đánh số">
                <FontAwesomeIcon icon={faListOl} />
              </button>
              <button type="button" className={styles.tool} aria-label="Trích dẫn">
                <FontAwesomeIcon icon={faQuoteLeft} />
              </button>
              <button type="button" className={styles.tool} aria-label="Căn trái">
                <FontAwesomeIcon icon={faAlignLeft} />
              </button>
            </div>

            <textarea
              className={styles.input}
              placeholder="Viết bình luận của bạn..."
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={4}
            />

            <div className={styles["editor-footer"]}>
              {hasDraft && (
                <button type="button" className={styles.submit} onClick={handleSubmitComment}>
                  Bình luận
                </button>
              )}
              <button
                type="button"
                className={styles.cancel}
                onClick={() => setDraft("")}
                disabled={!hasDraft}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PostDetailPage;
