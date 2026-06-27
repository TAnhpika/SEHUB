import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/common/Toast/ToastProvider";
import { loadPosts, POSTS_PER_PAGE, removePost } from "@/features/feed/feedData";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";

export function usePostFeed({ scrollTargetId = "home-top" } = {}) {
  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPost, setSelectedPost] = useState(null);
  const [editOnOpen, setEditOnOpen] = useState(false);
  const [focusCommentsOnOpen, setFocusCommentsOnOpen] = useState(false);
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [majorFilter, setMajorFilter] = useState("all");

  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const safePage = Math.min(currentPage, totalPages);

  useEffect(() => {
    let cancelled = false;

    async function fetchPosts() {
      setLoading(true);
      setError(null);
      try {
        const result = await loadPosts({
          page: currentPage,
          pageSize: POSTS_PER_PAGE,
          semester: semesterFilter,
          major: majorFilter,
        });
        if (!cancelled) {
          setPosts(result.items);
          setTotalCount(result.totalCount ?? 0);
          setTotalPages(Math.max(1, result.totalPages ?? 1));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message ?? "Không tải được danh sách bài viết.");
          setPosts([]);
          setTotalCount(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPosts();
    return () => {
      cancelled = true;
    };
  }, [currentPage, semesterFilter, majorFilter]);

  const handleSemesterChange = useCallback(
    (value) => {
      setSemesterFilter(value);
      setSearchParams({});
    },
    [setSearchParams],
  );

  const handleMajorChange = useCallback(
    (value) => {
      setMajorFilter(value);
      setSearchParams({});
    },
    [setSearchParams],
  );

  const goToPage = useCallback(
    (page) => {
      if (page < 1 || page > totalPages || page === safePage) return;
      setSearchParams(page === 1 ? {} : { page: String(page) });
      document.getElementById(scrollTargetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [totalPages, safePage, setSearchParams, scrollTargetId],
  );

  const closeModal = useCallback(() => {
    setSelectedPost(null);
    setEditOnOpen(false);
    setFocusCommentsOnOpen(false);
  }, []);

  const handleOpenPost = useCallback((post, options = {}) => {
    setSelectedPost(post);
    setEditOnOpen(false);
    setFocusCommentsOnOpen(Boolean(options.focusComments));
  }, []);

  const handleEditPost = useCallback((post) => {
    setSelectedPost(post);
    setEditOnOpen(true);
    setFocusCommentsOnOpen(false);
  }, []);

  const handleUpdatePost = useCallback((updatedPost) => {
    setPosts((prev) =>
      prev.map((item) => (item.id === updatedPost.id ? { ...item, ...updatedPost } : item)),
    );
    setSelectedPost(updatedPost);
    setEditOnOpen(false);
    setFocusCommentsOnOpen(false);
  }, []);

  const handleViewedPost = useCallback((viewedPost) => {
    if (!viewedPost?.id) return;
    setPosts((prev) =>
      prev.map((item) =>
        item.id === viewedPost.id
          ? { ...item, views: viewedPost.views ?? item.views }
          : item,
      ),
    );
  }, []);

  const handlePostChange = useCallback((patch) => {
    setPosts((prev) =>
      prev.map((item) => (item.id === patch.id ? { ...item, ...patch } : item)),
    );
    setSelectedPost((prev) => (prev?.id === patch.id ? { ...prev, ...patch } : prev));
  }, []);

  const handleDeletePost = useCallback(async (post) => {
    const confirmed = await confirm({
      title: "Xóa bài viết",
      description: "Bạn có chắc muốn xóa bài viết này?",
      confirmLabel: "Xóa",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      await removePost(post.id);
      setPosts((prev) => prev.filter((item) => item.id !== post.id));
      setTotalCount((count) => Math.max(0, count - 1));
      setSelectedPost(null);
      setEditOnOpen(false);
      setFocusCommentsOnOpen(false);
    } catch (err) {
      showToast(err.message ?? "Không xóa được bài viết.");
    }
  }, [confirm, showToast]);

  return {
    posts,
    loading,
    error,
    totalCount,
    totalPages,
    safePage,
    semesterFilter,
    majorFilter,
    selectedPost,
    editOnOpen,
    focusCommentsOnOpen,
    handleSemesterChange,
    handleMajorChange,
    goToPage,
    closeModal,
    handleOpenPost,
    handleEditPost,
    handleUpdatePost,
    handleViewedPost,
    handlePostChange,
    handleDeletePost,
  };
}
