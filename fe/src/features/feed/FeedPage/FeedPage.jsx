import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faPlus } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import Pagination from "@/common/Pagination/Pagination";
import PostCard from "@/features/feed/PostCard/PostCard";
import { MOCK_POSTS, POSTS_PER_PAGE } from "@/features/feed/feedData";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import styles from "./FeedPage.module.css";

function FeedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { requireAuth } = useRequireAuth();
  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);

  const totalPages = Math.ceil(MOCK_POSTS.length / POSTS_PER_PAGE);
  const safePage = Math.min(currentPage, totalPages);

  const pagePosts = useMemo(() => {
    const start = (safePage - 1) * POSTS_PER_PAGE;
    return MOCK_POSTS.slice(start, start + POSTS_PER_PAGE);
  }, [safePage]);

  function goToPage(page) {
    if (page < 1 || page > totalPages || page === safePage) return;
    setSearchParams(page === 1 ? {} : { page: String(page) });
    document.getElementById("feed-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleCreatePost() {
    requireAuth("Vui lòng đăng nhập để tạo bài viết.");
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
          <PostCard key={post.id} post={post} />
        ))}
      </div>

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
