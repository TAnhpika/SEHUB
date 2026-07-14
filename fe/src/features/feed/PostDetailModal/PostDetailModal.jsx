import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComment,
  faEye,
  faHeart,
  faShareNodes,
  faUserSlash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context";
import { Modal } from "@/common/Modal/Modal";
import { useToast } from "@/common/Toast/ToastProvider";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import RichTextContent from "@/common/RichTextEditor/RichTextContent";
import {
  loadPostById,
  savePost,
  toggleLike,
} from "@/features/feed/feedData";
import { countCommentsTree, usePostDetail } from "@/features/feed/hooks/usePostDetail";
import CommentThread from "@/features/feed/CommentThread/CommentThread";
import CommentPlainTextarea from "@/features/feed/CommentThread/CommentPlainTextarea";
import PostOwnerMenu from "@/features/feed/PostOwnerMenu/PostOwnerMenu";
import PostReportButton from "@/features/feed/PostReportButton/PostReportButton";
import UserReportButton from "@/features/reports/UserReportButton/UserReportButton";
import { copyPostLink, isOwnPost } from "@/features/feed/postUtils";
import CommentMentionPicker from "@/features/feed/CommentMentionPicker/CommentMentionPicker";
import PinnedBadge from "@/features/feed/shared/PinnedBadge/PinnedBadge";
import { filterDisplayTags } from "@/features/feed/shared/postDisplayUtils";
import { withPremiumUsernameClass } from "@/utils/premiumNameClass";
import PostImagesGallery from "@/features/posts/PostImagesGallery/PostImagesGallery";
import PostImagesPicker, {
  createPickerItemFromExisting,
  getExistingImageIds,
  getNewImageFiles,
  revokePickerPreview,
} from "@/features/posts/PostImagesPicker/PostImagesPicker";
import styles from "./PostDetailModal.module.css";

const LazyRichTextEditor = lazy(() => import("@/common/RichTextEditor/RichTextEditor"));

function RichTextEditorField(props) {
  return (
    <Suspense fallback={<p>Đang tải trình soạn thảo...</p>}>
      <LazyRichTextEditor {...props} />
    </Suspense>
  );
}

function PostDetailModal({
  post,
  open,
  onClose,
  onUpdate,
  onPostChange,
  onViewed,
  onDelete,
  initialEditMode = false,
  focusCommentsOnOpen = false,
}) {
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
  const { showCopyToast, showToast } = useToast();
  const { needsLoginPrompt, requireAuth } = useRequireAuth();
  const [commentSeed, setCommentSeed] = useState(undefined);
  const [commentCount, setCommentCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [displayTitle, setDisplayTitle] = useState("");
  const [displayBody, setDisplayBody] = useState("");
  const [displayImages, setDisplayImages] = useState([]);
  const [editImages, setEditImages] = useState([]);
  const [baselineImageIds, setBaselineImageIds] = useState([]);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [savingPost, setSavingPost] = useState(false);
  const onPostChangeRef = useRef(onPostChange);
  const commentsRef = useRef(null);

  useEffect(() => {
    onPostChangeRef.current = onPostChange;
  }, [onPostChange]);

  const handleCommentsChange = useCallback(
    (nextComments) => {
      if (!post?.id) return;
      const total = countCommentsTree(nextComments);
      setCommentCount(total);
      onPostChangeRef.current?.({
        id: post.id,
        comments: total,
        commentsList: nextComments,
      });
    },
    [post?.id],
  );

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
  } = usePostDetail(post?.id, {
    initialComments: commentSeed,
    onCommentsChange: handleCommentsChange,
  });

  function emitPostChange(patch) {
    onPostChangeRef.current?.(patch);
  }

  function syncImages(images) {
    const list = images ?? [];
    setDisplayImages(list);
    const pickerItems = list.map(createPickerItemFromExisting);
    setEditImages(pickerItems);
    setBaselineImageIds(getExistingImageIds(pickerItems));
  }

  useEffect(() => {
    if (!post || !open) return undefined;

    let cancelled = false;

    async function fetchDetail() {
      setCommentSeed(undefined);
      setIsEditing(initialEditMode);
      setDisplayTitle(post.title);
      setDisplayBody(post.body ?? post.excerpt);
      setEditTitle(post.title);
      setEditBody(post.body ?? post.excerpt);
      syncImages(post.images ?? []);
      setLikeCount(post.likes ?? 0);
      setLiked(Boolean(post.isLiked));
      setViewCount(post.views ?? 0);
      setCommentSeed(post.commentsList ?? []);
      setCommentCount(post.comments ?? 0);

      try {
        const detail = await loadPostById(post.id);
        if (cancelled || !detail) return;

        setCommentSeed(detail.commentsList ?? []);
        setCommentCount(detail.comments ?? 0);
        setDisplayTitle(detail.title);
        setDisplayBody(detail.body ?? detail.excerpt);
        setEditTitle(detail.title);
        setEditBody(detail.body ?? detail.excerpt);
        syncImages(detail.images ?? []);
        setLikeCount(detail.likes ?? 0);
        setLiked(Boolean(detail.isLiked));
        setViewCount(detail.views ?? 0);
        emitPostChange({
          id: post.id,
          comments: detail.comments ?? 0,
          commentsList: detail.commentsList ?? [],
          likes: detail.likes ?? 0,
          views: detail.views ?? 0,
          isLiked: detail.isLiked,
          images: detail.images ?? [],
        });
        onViewed?.(detail);
      } catch {
        // Giữ dữ liệu từ danh sách nếu không tải được chi tiết.
      }
    }

    fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [post?.id, open, initialEditMode]);

  useEffect(() => {
    if (!open || !focusCommentsOnOpen) {
      return;
    }

    const timer = setTimeout(() => {
      commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);

    return () => clearTimeout(timer);
  }, [open, focusCommentsOnOpen, post?.id]);

  if (!open || !post) return null;

  const isOwner = isOwnPost(post, user);
  const displayTags = filterDisplayTags(post.tags);

  function openProfile(username) {
    if (!username) return;
    navigate(`/profile/${username}`);
  }

  function handleCancelDraft() {
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
    setEditImages(displayImages.map(createPickerItemFromExisting));
    setBaselineImageIds(displayImages.map((image) => image.id).filter(Boolean));
    setIsEditing(true);
  }

  function handleCancelEdit() {
    editImages.forEach((item) => {
      if (item.file) revokePickerPreview(item);
    });
    setEditTitle(displayTitle);
    setEditBody(displayBody);
    setEditImages(displayImages.map(createPickerItemFromExisting));
    setIsEditing(false);
  }

  async function handleSaveEdit() {
    const title = editTitle.trim();
    const body = editBody.trim();
    if (!title || !body || savingPost) return;

    setSavingPost(true);
    try {
      const keptIds = new Set(getExistingImageIds(editImages));
      const deletedImageIds = baselineImageIds.filter((id) => !keptIds.has(id));

      const updatedPost = await savePost(post.id, {
        title,
        content: body,
        tags: post.tags,
        deletedImageIds,
        newImageFiles: getNewImageFiles(editImages),
      });

      const mergedPost = {
        ...post,
        ...updatedPost,
        title,
        body,
        excerpt: body,
        images: updatedPost.images ?? [],
      };
      setDisplayTitle(title);
      setDisplayBody(body);
      syncImages(updatedPost.images ?? []);
      setIsEditing(false);
      onUpdate?.(mergedPost);
      showToast("Đã cập nhật bài viết.");
    } catch (err) {
      showToast(err.message ?? "Không cập nhật được bài viết.");
    } finally {
      setSavingPost(false);
    }
  }

  function handleDeletePost() {
    onDelete?.(post);
    onClose();
  }

  async function handleShare() {
    try {
      await copyPostLink(post.id);
      showCopyToast();
    } catch {
      showCopyToast();
    }
  }

  function handleScrollToComments() {
    commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleLike() {
    if (needsLoginPrompt) {
      requireAuth("Vui lòng đăng nhập để thích bài viết.");
      return;
    }
    if (liking) return;

    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((count) => (liked ? Math.max(0, count - 1) : count + 1));
    setLiking(true);

    try {
      const result = await toggleLike(post.id, liked);
      setLiked(result.isLiked);
      setLikeCount(result.likeCount);
      emitPostChange({
        id: post.id,
        likes: result.likeCount,
        isLiked: result.isLiked,
      });
    } catch {
      setLiked(liked);
      setLikeCount(post.likes ?? 0);
    } finally {
      setLiking(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      className={styles.overlay}
      panelClassName={styles.dialog}
      closeOnOverlay
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
                    <p className={styles.date}>{post.publishedAt}</p>
                  </div>
                </button>
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
                  <RichTextEditorField
                    value={editBody}
                    onChange={setEditBody}
                    variant="full"
                    rows={5}
                    toolbarAriaLabel="Định dạng nội dung"
                    aria-label="Chỉnh sửa nội dung bài viết"
                    allowImages={false}
                  />
                </label>
                <PostImagesPicker
                  items={editImages}
                  onChange={setEditImages}
                  disabled={savingPost}
                />
                <div className={styles["edit-actions"]}>
                  <button type="button" className={styles["edit-save"]} onClick={handleSaveEdit} disabled={savingPost}>
                    Lưu thay đổi
                  </button>
                  <button type="button" className={styles["edit-cancel"]} onClick={handleCancelEdit} disabled={savingPost}>
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.titleRow}>
                  {post.isPinned ? <PinnedBadge /> : null}
                  <h3 className={styles.title}>{displayTitle}</h3>
                </div>
                <PostImagesGallery images={displayImages} />
                <RichTextContent value={displayBody} className={styles.content} />
                {displayTags.length > 0 ? (
                  <ul className={styles.tags} aria-label="Thẻ bài viết">
                    {displayTags.map((tag) => (
                      <li key={tag} className={styles.tag}>
                        {tag}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            )}

            <div className={styles.stats}>
              <button
                type="button"
                className={`${styles.stat} ${liked ? styles.statActive : ""}`}
                aria-label="Thích bài viết"
                aria-pressed={liked}
                disabled={liking}
                onClick={handleLike}
              >
                <FontAwesomeIcon icon={faHeart} />
                {likeCount}
              </button>
              <button
                type="button"
                className={styles.stat}
                aria-label="Bình luận"
                onClick={handleScrollToComments}
              >
                <FontAwesomeIcon icon={faComment} />
                {commentCount}
              </button>
              <span className={styles.stat} aria-label="Lượt xem">
                <FontAwesomeIcon icon={faEye} />
                {viewCount}
              </span>
              <div className={styles["footer-actions"]}>
                {!isOwner && (
                  <>
                    <PostReportButton
                      postId={post.id}
                      postTitle={post.title}
                      className={`${styles.share} ${styles.report}`}
                    />
                    {post.author?.id ? (
                      <UserReportButton
                        userId={post.author.id}
                        username={post.author.username}
                        source="post"
                        postId={post.id}
                        className={`${styles.share} ${styles.report}`}
                        label="Báo cáo tác giả"
                        icon={faUserSlash}
                      />
                    ) : null}
                  </>
                )}
                <button type="button" className={styles.share} aria-label="Chia sẻ" onClick={handleShare}>
                  <FontAwesomeIcon icon={faShareNodes} />
                </button>
              </div>
            </div>
          </article>

          <section ref={commentsRef} className={styles.comments} aria-label="Bình luận">
            {comments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                postId={post.id}
                user={user}
                styles={styles}
                editingCommentId={editingCommentId}
                editCommentDraft={editCommentDraft}
                setEditCommentDraft={setEditCommentDraft}
                onOpenProfile={openProfile}
                onStartEdit={handleStartEditComment}
                onCancelEdit={handleCancelEditComment}
                onSaveEdit={handleSaveEditComment}
                onDelete={handleDeleteComment}
                onReply={handleReply}
                EditorComponent={CommentPlainTextarea}
              />
            ))}

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
                <CommentPlainTextarea
                  value={draft}
                  onChange={setDraft}
                  placeholder="Viết bình luận công khai"
                  rows={4}
                  textareaClassName={styles.input}
                  aria-label="Viết bình luận công khai"
                  onKeyDown={handleDraftKeyDown}
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
    </Modal>
  );
}

export default PostDetailModal;
