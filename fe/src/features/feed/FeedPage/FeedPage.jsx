import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import Pagination from "@/common/Pagination/Pagination";
import PostCard from "@/features/feed/PostCard/PostCard";
import PostDetailModal from "@/features/feed/PostDetailModal/PostDetailModal";
import PostFeedFilters from "@/features/feed/PostFeedFilters/PostFeedFilters";
import { MOCK_POSTS, POSTS_PER_PAGE } from "@/features/feed/feedData";
import { filterPosts } from "@/features/feed/feedFilterData";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import styles from "./FeedPage.module.css";

function FeedPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState(() => [...MOCK_POSTS]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [editOnOpen, setEditOnOpen] = useState(false);
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [majorFilter, setMajorFilter] = useState("all");
  const { isAuthenticated, requireAuth } = useRequireAuth();
  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);

  const filteredPosts = useMemo(
    () => filterPosts(posts, semesterFilter, majorFilter),
    [posts, semesterFilter, majorFilter],
  );

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const safePage = Math.min(currentPage, totalPages || 1);

  const pagePosts = useMemo(() => {
    const start = (safePage - 1) * POSTS_PER_PAGE;
    return filteredPosts.slice(start, start + POSTS_PER_PAGE);
  }, [filteredPosts, safePage]);

  function handleSemesterChange(value) {
    setSemesterFilter(value);
    setSearchParams({});
  }

  function handleMajorChange(value) {
    setMajorFilter(value);
    setSearchParams({});
  }

  function goToPage(page) {
    if (page < 1 || page > totalPages || page === safePage) return;
    setSearchParams(page === 1 ? {} : { page: String(page) });
    document.getElementById("feed-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleCreatePost() {
    if (!isAuthenticated) {
      requireAuth("Vui lòng đăng nhập để tạo bài viết.");
      return;
    }
    navigate("/home/create-post");
  }

  function handleOpenPost(post) {
    setSelectedPost(post);
    setEditOnOpen(false);
  }

  function handleEditPost(post) {
    setSelectedPost(post);
    setEditOnOpen(true);
  }

  function handleUpdatePost(updatedPost) {
    setPosts((prev) => prev.map((item) => (item.id === updatedPost.id ? updatedPost : item)));
    setSelectedPost(updatedPost);
    setEditOnOpen(false);
  }

  function handleDeletePost(post) {
    const confirmed = window.confirm("Bạn có chắc muốn xóa bài viết này?");
    if (!confirmed) return;

    setPosts((prev) => prev.filter((item) => item.id !== post.id));
    setSelectedPost(null);
    setEditOnOpen(false);
  }

  return (
    <div className={styles.page}>
      <header className={styles["header-card"]}>
        <div className={styles["header-text"]}>
          <h1 className={styles.title}>Bài viết mới nhất</h1>
          <p className={styles.subtitle}>2 bài viết hôm nay</p>
        </div>

        <div className={styles["header-actions"]}>
          <Button
            look="soft"
            size="sm"
            className={styles["create-btn"]}
            onClick={handleCreatePost}
          >
            <FontAwesomeIcon icon={faPlus} />
            Tạo bài viết
          </Button>

          <PostFeedFilters
            semester={semesterFilter}
            major={majorFilter}
            onSemesterChange={handleSemesterChange}
            onMajorChange={handleMajorChange}
          />
        </div>
      </header>

      <div className={styles.list}>
        {pagePosts.length > 0 ? (
          pagePosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onOpen={handleOpenPost}
              onEdit={handleEditPost}
              onDelete={handleDeletePost}
            />
          ))
        ) : (
          <p className={styles.empty}>Không có bài viết phù hợp với bộ lọc.</p>
        )}
      </div>

      <PostDetailModal
        post={selectedPost}
        open={Boolean(selectedPost)}
        onClose={() => {
          setSelectedPost(null);
          setEditOnOpen(false);
        }}
        onUpdate={handleUpdatePost}
        onDelete={handleDeletePost}
        initialEditMode={editOnOpen}
      />

      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={goToPage}
        ariaLabel="Phân trang bài viết"
      />
    </div>
  );
}

export default FeedPage;
