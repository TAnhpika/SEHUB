import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faPlus } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import Pagination from "@/common/Pagination/Pagination";
import PostCard from "@/features/feed/PostCard/PostCard";
import PostDetailModal from "@/features/feed/PostDetailModal/PostDetailModal";
import { MOCK_POSTS, POSTS_PER_PAGE } from "@/features/feed/feedData";
import { useAuth } from "@/context/AuthContext";
import styles from "./HomePage.module.css";

function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState(() => [...MOCK_POSTS]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [editOnOpen, setEditOnOpen] = useState(false);
  const { user } = useAuth();
  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);

  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const safePage = Math.min(currentPage, totalPages || 1);

  const pagePosts = useMemo(() => {
    const start = (safePage - 1) * POSTS_PER_PAGE;
    return posts.slice(start, start + POSTS_PER_PAGE);
  }, [posts, safePage]);

  function goToPage(page) {
    if (page < 1 || page > totalPages || page === safePage) return;
    setSearchParams(page === 1 ? {} : { page: String(page) });
    document.getElementById("home-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
          <p className={styles.subtitle}>
            Xin chào, <strong>{user?.displayName ?? user?.username}</strong> · 2 bài viết hôm
            nay
          </p>
        </div>

        <div className={styles["header-actions"]}>
          <Button look="soft" size="sm" className={styles["create-btn"]}>
            <FontAwesomeIcon icon={faPlus} />
            Tạo bài viết
          </Button>

          <div className={styles.filters}>
            <button type="button" className={styles.filter}>
              Học kỳ 6
              <FontAwesomeIcon icon={faChevronDown} />
            </button>
            <button type="button" className={styles.filter}>
              Tất cả chuyên ngành
              <FontAwesomeIcon icon={faChevronDown} />
            </button>
          </div>
        </div>
      </header>

      <div className={styles.list}>
        {pagePosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            interactive
            onOpen={handleOpenPost}
            onEdit={handleEditPost}
            onDelete={handleDeletePost}
          />
        ))}
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

export default HomePage;
