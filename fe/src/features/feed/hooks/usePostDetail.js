import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/common/Toast/ToastProvider";
import { stripRichTextMarkup } from "@/common/RichTextEditor/richTextPreviewHtml";
import { insertMention } from "@/features/feed/CommentMentionPicker/CommentMentionPicker";
import { removeComment, saveComment, submitComment } from "@/features/feed/feedData";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";

export function countCommentsTree(comments) {
  if (!Array.isArray(comments) || comments.length === 0) return 0;
  return comments.reduce((sum, comment) => sum + 1 + countCommentsTree(comment.replies), 0);
}

function insertReplyIntoTree(comments, parentId, newComment) {
  return comments.map((comment) => {
    if (comment.id === parentId) {
      return {
        ...comment,
        replies: [...(comment.replies ?? []), newComment],
      };
    }
    if (comment.replies?.length) {
      return {
        ...comment,
        replies: insertReplyIntoTree(comment.replies, parentId, newComment),
      };
    }
    return comment;
  });
}

function updateCommentInTree(comments, commentId, patch) {
  return comments.map((comment) => {
    if (comment.id === commentId) {
      return { ...comment, ...patch };
    }
    if (comment.replies?.length) {
      return {
        ...comment,
        replies: updateCommentInTree(comment.replies, commentId, patch),
      };
    }
    return comment;
  });
}

function removeCommentFromTree(comments, commentId) {
  return comments
    .filter((comment) => comment.id !== commentId)
    .map((comment) =>
      comment.replies?.length
        ? { ...comment, replies: removeCommentFromTree(comment.replies, commentId) }
        : comment,
    );
}

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
      const parentId = replyTarget?.id ?? null;
      const newComment = await submitComment(postId, content, parentId);
      const next = parentId
        ? insertReplyIntoTree(comments, parentId, { ...newComment, replies: newComment.replies ?? [] })
        : [...comments, { ...newComment, replies: newComment.replies ?? [] }];
      applyComments(next);
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
    setEditCommentDraft(stripRichTextMarkup(comment.content ?? ""));
  }, []);

  const handleCancelEditComment = useCallback(() => {
    setEditingCommentId(null);
    setEditCommentDraft("");
  }, []);

  const handleSaveEditComment = useCallback(
    async (commentId) => {
      const content = editCommentDraft.trim();
      if (!content || !postId) return;

      try {
        const updated = await saveComment(postId, commentId, content);
        applyComments(
          updateCommentInTree(comments, commentId, {
            content: updated?.content ?? content,
          }),
        );
        setEditingCommentId(null);
        setEditCommentDraft("");
      } catch (err) {
        showToast(err.message ?? "Không cập nhật được bình luận.");
      }
    },
    [editCommentDraft, postId, comments, applyComments, showToast],
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
        applyComments(removeCommentFromTree(comments, commentId));
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
