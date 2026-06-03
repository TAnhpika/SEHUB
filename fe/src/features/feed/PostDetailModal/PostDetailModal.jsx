import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAlignLeft,
  faBold,
  faCode,
  faComment,
  faEllipsis,
  faEye,
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
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context/AuthContext";
import PostOwnerMenu from "@/features/feed/PostOwnerMenu/PostOwnerMenu";
import { isOwnPost } from "@/features/feed/postUtils";
import styles from "./PostDetailModal.module.css";

function formatCommentTime(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

function PostDetailModal({ post, open, onClose, onUpdate, onDelete, initialEditMode = false }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(0);
  const [draft, setDraft] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [displayTitle, setDisplayTitle] = useState("");
  const [displayBody, setDisplayBody] = useState("");

  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!post) return;
    setComments(post.commentsList ?? []);
    setCommentCount(post.comments ?? 0);
    setDraft("");
    setDisplayTitle(post.title);
    setDisplayBody(post.body ?? post.excerpt);
    setEditTitle(post.title);
    setEditBody(post.body ?? post.excerpt);
    setIsEditing(initialEditMode);
  }, [post, initialEditMode]);

  if (!open || !post) return null;

  const isOwner = isOwnPost(post, user);
  const hasDraft = draft.trim().length > 0;

  function handleCancelDraft() {
    setDraft("");
  }

  function handleSubmitComment() {
    const content = draft.trim();
    if (!content) return;

    const newComment = {
      id: Date.now(),
      author: {
        name: user?.displayName ?? "Anhpika",
        initial: user?.initial ?? "A",
      },
      time: formatCommentTime(new Date()),
      content,
    };

    setComments((prev) => [...prev, newComment]);
    setCommentCount((prev) => prev + 1);
    setDraft("");
  }

  function handleDraftKeyDown(event) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleSubmitComment();
    }
  }

  function handleStartEdit() {
    setEditTitle(displayTitle);
    setEditBody(displayBody);
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setEditTitle(displayTitle);
    setEditBody(displayBody);
    setIsEditing(false);
  }

  function handleSaveEdit() {
    const title = editTitle.trim();
    const body = editBody.trim();
    if (!title || !body) return;

    const updatedPost = {
      ...post,
      title,
      body,
      excerpt: body,
    };

    setDisplayTitle(title);
    setDisplayBody(body);
    setIsEditing(false);
    onUpdate?.(updatedPost);
  }

  function handleDeletePost() {
    onDelete?.(post);
    onClose();
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 id="post-detail-title" className={styles["header-title"]}>
            Bài viết của {post.author.username}
          </h2>
          <button type="button" className={styles.close} aria-label="Đóng" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>

        <div className={styles.body}>
          <article className={styles.post}>
            <div className={styles["author-row"]}>
              <div className={styles.author}>
                <span className={styles.avatar} aria-hidden="true">
                  {post.author.initial}
                </span>
                <div>
                  <p className={styles.username}>{post.author.username}</p>
                  <p className={styles.date}>{post.publishedAt}</p>
                </div>
              </div>

              {isOwner && !isEditing && (
                <PostOwnerMenu onEdit={handleStartEdit} onDelete={handleDeletePost} />
              )}
            </div>

            {isEditing ? (
              <div className={styles["edit-form"]}>
                <label className={styles.field}>
                  <span className={styles.label}>Tiêu đề</span>
                  <input
                    type="text"
                    className={styles["edit-input"]}
                    value={editTitle}
                    onChange={(event) => setEditTitle(event.target.value)}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Nội dung</span>
                  <textarea
                    className={styles["edit-textarea"]}
                    value={editBody}
                    onChange={(event) => setEditBody(event.target.value)}
                    rows={5}
                  />
                </label>
                <div className={styles["edit-actions"]}>
                  <button type="button" className={styles["edit-save"]} onClick={handleSaveEdit}>
                    Lưu thay đổi
                  </button>
                  <button type="button" className={styles["edit-cancel"]} onClick={handleCancelEdit}>
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 className={styles.title}>
                  <span className={styles.hash}>#</span> <strong>{displayTitle}</strong>
                </h3>
                <p className={styles.content}>{displayBody}</p>
              </>
            )}

            <div className={styles.stats}>
              <span className={styles.stat}>
                <FontAwesomeIcon icon={faHeart} className={styles["stat-liked"]} />
                {post.likes}
              </span>
              <span className={styles.stat}>
                <FontAwesomeIcon icon={faComment} />
                {commentCount}
              </span>
              <span className={styles.stat}>
                <FontAwesomeIcon icon={faEye} />
                {post.views}
              </span>
              <button type="button" className={styles.share} aria-label="Chia sẻ">
                <FontAwesomeIcon icon={faShareNodes} />
              </button>
            </div>
          </article>

          <section className={styles.comments} aria-label="Bình luận">
            {comments.map((comment) => (
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
                  <button type="button" className={styles["comment-menu"]} aria-label="Tùy chọn">
                    <FontAwesomeIcon icon={faEllipsis} />
                  </button>
                </div>
                <p className={styles["comment-content"]}>{comment.content}</p>
                <button type="button" className={styles.reply}>
                  <FontAwesomeIcon icon={faReply} />
                  Trả lời
                </button>
              </article>
            ))}

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
                  placeholder="Viết bình luận công khai"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleDraftKeyDown}
                  rows={4}
                  aria-label="Viết bình luận công khai"
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
                    onClick={handleCancelDraft}
                    disabled={!hasDraft}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default PostDetailModal;
