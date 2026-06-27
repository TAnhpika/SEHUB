import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faComment,
  faEye,
  faHeart,
  faReply,
  faShareNodes,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context";
import { useToast } from "@/common/Toast/ToastProvider";
import RichTextEditor from "@/common/RichTextEditor/RichTextEditor";
import RichTextContent from "@/common/RichTextEditor/RichTextContent";
import {
  loadPostById,
  toggleLike,
} from "@/features/feed/feedData";
import { usePostDetail } from "@/features/feed/hooks/usePostDetail";
import PostOwnerMenu from "@/features/feed/PostOwnerMenu/PostOwnerMenu";
import PostReportButton from "@/features/feed/PostReportButton/PostReportButton";
import { copyPostLink, formatDisplayTitle, isOwnComment, isOwnPost } from "@/features/feed/postUtils";
import CommentMentionPicker from "@/features/feed/CommentMentionPicker/CommentMentionPicker";
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

  const {
    comments,
    draft,
    setDraft,
    editingCommentId,
    editCommentDraft,
    setEditCommentDraft,
    replyTarget,
    setReplyTarget,
    hasDraft,
    handleSubmitComment,
    handleReply,
    handleInsertMention,
    handleStartEditComment,
    handleCancelEditComment,
    handleSaveEditComment,
    handleDeleteComment,
  } = usePostDetail(postId, { initialComments: post?.commentsList });

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
  const shortDate = formatShortDate(post.publishedAt);
  const displayTitle = formatDisplayTitle(post.title);

  function openProfile(username) {
    if (!username) return;
    navigate(`/profile/${username}`);
  }

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

  return (
    <div className={styles.page}>
      <button type="button" className={styles.back} onClick={() => navigate(-1)}>
        <FontAwesomeIcon icon={faArrowLeft} />
        Quay lại
      </button>

      <article className={styles.card}>
        <header className={styles.header}>
          <div className={styles.author}>
            <button
              type="button"
              className={styles["profile-trigger"]}
              onClick={() => openProfile(post.author.username)}
            >
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
            </button>
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
        <RichTextContent value={post.body ?? post.excerpt} className={styles.body} />

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
                <button
                  type="button"
                  className={`${styles["comment-author"]} ${styles["profile-trigger"]}`}
                  onClick={() => openProfile(comment.author.username)}
                >
                  <span className={styles["comment-avatar"]} aria-hidden="true">
                    {comment.author.initial}
                  </span>
                  <div>
                    <p className={styles["comment-name"]}>{comment.author.name}</p>
                    <p className={styles["comment-time"]}>{comment.time}</p>
                  </div>
                </button>

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
                  <RichTextEditor
                    value={editCommentDraft}
                    onChange={setEditCommentDraft}
                    variant="comment"
                    rows={3}
                    bordered={false}
                    textareaClassName={styles["comment-edit-input"]}
                    toolbarAriaLabel="Định dạng bình luận"
                    aria-label="Chỉnh sửa bình luận"
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
                <RichTextContent value={comment.content} className={styles["comment-content"]} />
              )}

              {!isEditingComment && (
                <button type="button" className={styles.reply} onClick={() => handleReply(comment)}>
                  <FontAwesomeIcon icon={faReply} />
                  Trả lời
                </button>
              )}
            </article>
          );
        })}

        <div className={styles.editor}>
          <div className={styles["editor-panel"]}>
            {replyTarget ? (
              <div className={styles["reply-banner"]}>
                <span>
                  Đang trả lời <strong>@{replyTarget.username ?? replyTarget.name}</strong>
                </span>
                <button type="button" onClick={() => setReplyTarget(null)}>
                  Hủy
                </button>
              </div>
            ) : null}
            <RichTextEditor
              value={draft}
              onChange={setDraft}
              placeholder="Viết bình luận của bạn..."
              variant="comment"
              rows={4}
              bordered={false}
              textareaClassName={styles.input}
              toolbarAriaLabel="Định dạng bình luận"
              aria-label="Viết bình luận của bạn"
            />
            <CommentMentionPicker value={draft} onInsert={handleInsertMention} />

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
