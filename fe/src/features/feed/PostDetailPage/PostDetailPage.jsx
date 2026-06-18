import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAlignLeft,
  faArrowLeft,
  faBold,
  faCode,
  faComment,
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
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context";
import { useToast } from "@/common/Toast/ToastProvider";
import {
  loadPostById,
  removeComment,
  submitComment,
  toggleLike,
} from "@/features/feed/feedData";
import PostOwnerMenu from "@/features/feed/PostOwnerMenu/PostOwnerMenu";
import PostReportButton from "@/features/feed/PostReportButton/PostReportButton";
import ChatImageLightbox from "@/features/chat/ChatImageLightbox/ChatImageLightbox";
import { copyPostLink, formatDisplayTitle, isOwnComment, isOwnPost } from "@/features/feed/postUtils";
import { withPremiumUsernameClass } from "@/utils/premiumNameClass";
import styles from "./PostDetailPage.module.css";

function formatShortDate(publishedAt) {
  if (!publishedAt) return "";
  const match = publishedAt.match(/(\d+)\s+tháng\s+(\d+),\s+(\d+)/);
  if (!match) return publishedAt;
  return `${match[1]}/${match[2]}/${match[3]}`;
}

function PostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
  const { showCopyToast } = useToast();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentDraft, setEditCommentDraft] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPost() {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await loadPostById(postId);
        if (cancelled) return;
        if (!data) {
          setPost(null);
          return;
        }
        setPost(data);
        setLikes(data.likes);
        setLiked(Boolean(data.isLiked));
        setComments(data.commentsList ?? []);
        setDraft("");
        setEditingCommentId(null);
        setEditCommentDraft("");
      } catch (err) {
        if (!cancelled) {
          setLoadError(err.message ?? "Không tải được bài viết.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPost();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  if (loading) {
    return (
      <div className={styles.page}>
        <p>Đang tải bài viết...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.page}>
        <p role="alert">{loadError}</p>
        <button type="button" className={styles.back} onClick={() => navigate(-1)}>
          Quay lại
        </button>
      </div>
    );
  }

  if (!post) {
    return <Navigate to="/home" replace />;
  }

  const isOwner = isOwnPost(post, user);
  const hasDraft = draft.trim().length > 0;
  const shortDate = formatShortDate(post.publishedAt);
  const displayTitle = formatDisplayTitle(post.title);

  async function handleLike() {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikes((count) => (liked ? count - 1 : count + 1));

    try {
      const result = await toggleLike(post.id, liked);
      setLiked(result.isLiked);
      setLikes(result.likeCount);
    } catch {
      setLiked(liked);
      setLikes(post.likes);
    }
  }

  async function handleShare() {
    try {
      await copyPostLink(post.id);
      showCopyToast();
    } catch {
      showCopyToast();
    }
  }

  async function handleSubmitComment() {
    const content = draft.trim();
    if (!content || submittingComment) return;

    setSubmittingComment(true);
    try {
      const newComment = await submitComment(post.id, content);
      setComments((prev) => [...prev, newComment]);
      setDraft("");
    } catch (err) {
      window.alert(err.message ?? "Không gửi được bình luận.");
    } finally {
      setSubmittingComment(false);
    }
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

  async function handleDeleteComment(commentId) {
    const confirmed = window.confirm("Bạn có chắc muốn xóa bình luận này?");
    if (!confirmed) return;

    try {
      await removeComment(post.id, commentId);
      setComments((prev) => prev.filter((item) => item.id !== commentId));
      if (editingCommentId === commentId) {
        setEditingCommentId(null);
        setEditCommentDraft("");
      }
    } catch (err) {
      window.alert(err.message ?? "Không xóa được bình luận.");
    }
  }

  return (
    <div className={styles.page}>
      <button type="button" className={styles.back} onClick={() => navigate(-1)}>
        <FontAwesomeIcon icon={faArrowLeft} />
        Quay lại
      </button>

      <article className={styles.card}>
        <header className={styles.header}>
          <div className={styles.author}>
            <span className={styles.avatar} aria-hidden="true">
              {post.author.initial}
            </span>
            <div>
              <p
                className={withPremiumUsernameClass(
                  styles.username,
                  isOwner && isPremium,
                )}
              >
                {post.author.username}
              </p>
              <p className={styles.meta}>
                {shortDate}
                {!isOwner && post.author.club ? ` · ${post.author.club}` : ""}
              </p>
            </div>
          </div>

          <div className={styles["header-actions"]}>
            {!isOwner && (
              <PostReportButton
                postId={post.id}
                postTitle={displayTitle}
                className={`${styles.share} ${styles.report}`}
              />
            )}
            <button type="button" className={styles.share} aria-label="Chia sẻ" onClick={handleShare}>
              <FontAwesomeIcon icon={faShareNodes} />
            </button>
          </div>
        </header>

        <h1 className={styles.title}>
          <span className={styles.hash}>#</span> {displayTitle}
        </h1>
        {post.coverImageUrl ? (
          <button
            type="button"
            className={styles.coverBtn}
            aria-label="Xem ảnh bìa full"
            onClick={() =>
              setLightboxImage({
                url: post.coverImageUrl,
                alt: displayTitle || "Ảnh bìa bài viết",
              })
            }
          >
            <img
              src={post.coverImageUrl}
              alt=""
              className={styles.cover}
              loading="lazy"
            />
          </button>
        ) : post.images?.length > 0 ? (
          <div className={styles.images}>
            {post.images.map((image) => (
              <img key={image.id} className={styles.image} src={image.url} alt="" loading="lazy" />
            ))}
          </div>
        ) : null}
        <p className={styles.body}>{post.body ?? post.excerpt}</p>

        {post.tags?.length > 0 && (
          <ul className={styles.tags} aria-label="Thẻ bài viết">
            {post.tags.map((tag) => (
              <li key={tag} className={styles.tag}>
                {tag}
              </li>
            ))}
          </ul>
        )}

        <footer className={styles.footer}>
          <div className={styles.stats}>
            <span className={styles.stat}>
              <FontAwesomeIcon icon={faHeart} />
              {likes}
            </span>
            <span className={styles.stat}>
              <FontAwesomeIcon icon={faComment} />
              {comments.length}
            </span>
            <span className={styles.stat}>
              <FontAwesomeIcon icon={faEye} />
              {post.views}
            </span>
          </div>
        </footer>

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

      <ChatImageLightbox
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
        onImageClick={() => setLightboxImage(null)}
      />
    </div>
  );
}

export default PostDetailPage;
