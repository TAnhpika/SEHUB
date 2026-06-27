import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/common/Toast/ToastProvider";
import { insertMention } from "@/features/feed/CommentMentionPicker/CommentMentionPicker";
import { removeComment, submitComment } from "@/features/feed/feedData";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";

export function usePostDetail(postId, { initialComments, onCommentsChange } = {}) {
  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();

  const [comments, setComments] = useState(initialComments ?? []);
  const [draft, setDraft] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentDraft, setEditCommentDraft] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);

  useEffect(() => {
    if (initialComments === undefined) return;
    setComments(initialComments);
    setDraft("");
    setEditingCommentId(null);
    setEditCommentDraft("");
    setReplyTarget(null);
  }, [postId, initialComments]);

  const applyComments = useCallback(
    (nextComments) => {
      setComments(nextComments);
      onCommentsChange?.(nextComments);
    },
    [onCommentsChange],
  );

  const handleSubmitComment = useCallback(async () => {
    const content = draft.trim();
    if (!content || submittingComment || !postId) return;

    setSubmittingComment(true);
    try {
      const newComment = await submitComment(postId, content, replyTarget?.id ?? null);
      applyComments([...comments, newComment]);
      setDraft("");
      setReplyTarget(null);
    } catch (err) {
      showToast(err.message ?? "Không gửi được bình luận.");
    } finally {
      setSubmittingComment(false);
    }
  }, [postId, draft, submittingComment, replyTarget, comments, applyComments, showToast]);

  const handleReply = useCallback((comment) => {
    setReplyTarget({
      id: comment.id,
      username: comment.author?.username,
      name: comment.author?.name ?? comment.author?.displayName,
    });
    if (comment.author?.username) {
      setDraft((prev) => insertMention(prev, comment.author.username));
    }
  }, []);

  const handleInsertMention = useCallback((username) => {
    setDraft((prev) => insertMention(prev, username));
  }, []);

  const handleStartEditComment = useCallback((comment) => {
    setEditingCommentId(comment.id);
    setEditCommentDraft(comment.content);
  }, []);

  const handleCancelEditComment = useCallback(() => {
    setEditingCommentId(null);
    setEditCommentDraft("");
  }, []);

  const handleSaveEditComment = useCallback(
    (commentId) => {
      const content = editCommentDraft.trim();
      if (!content) return;

      applyComments(comments.map((item) => (item.id === commentId ? { ...item, content } : item)));
      setEditingCommentId(null);
      setEditCommentDraft("");
    },
    [editCommentDraft, comments, applyComments],
  );

  const handleDeleteComment = useCallback(
    async (commentId) => {
      const confirmed = await confirm({
        title: "Xóa bình luận",
        description: "Bạn có chắc muốn xóa bình luận này?",
        confirmLabel: "Xóa",
        variant: "danger",
      });
      if (!confirmed || !postId) return;

      try {
        await removeComment(postId, commentId);
        applyComments(comments.filter((item) => item.id !== commentId));
        if (editingCommentId === commentId) {
          setEditingCommentId(null);
          setEditCommentDraft("");
        }
      } catch (err) {
        showToast(err.message ?? "Không xóa được bình luận.");
      }
    },
    [confirm, postId, comments, editingCommentId, applyComments, showToast],
  );

  return {
    comments,
    draft,
    setDraft,
    editingCommentId,
    editCommentDraft,
    setEditCommentDraft,
    submittingComment,
    replyTarget,
    setReplyTarget,
    hasDraft: draft.trim().length > 0,
    handleSubmitComment,
    handleReply,
    handleInsertMention,
    handleStartEditComment,
    handleCancelEditComment,
    handleSaveEditComment,
    handleDeleteComment,
  };
}
