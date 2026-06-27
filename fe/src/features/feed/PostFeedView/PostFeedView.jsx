import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import Pagination from "@/common/Pagination/Pagination";
import PostCard from "@/features/feed/PostCard/PostCard";
import PostDetailModal from "@/features/feed/PostDetailModal/PostDetailModal";
import PostFeedFilters from "@/features/feed/PostFeedFilters/PostFeedFilters";
import PostFeedSkeleton from "@/features/feed/PostFeedSkeleton/PostFeedSkeleton";
import styles from "./PostFeedView.module.css";

function PostFeedView({
  subtitle,
  interactive = false,
  createPostMode = "link",
  onCreatePost,
  feed,
  modalExtras = {},
}) {
  const {
    posts,
    loading,
    error,
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
    handlePostChange,
    handleDeletePost,
  } = feed;

  return (
    <div className={styles.page}>
      <header className={styles["header-card"]}>
        <div className={styles["header-text"]}>
          <h1 className={styles.title}>Bài viết mới nhất</h1>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>

        <div className={styles["header-actions"]}>
          {createPostMode === "link" ? (
            <Button look="soft" size="sm" className={styles["create-btn"]} to="/home/create-post">
              <FontAwesomeIcon icon={faPlus} />
              Tạo bài viết
            </Button>
          ) : (
            <Button
              look="soft"
              size="sm"
              className={styles["create-btn"]}
              onClick={onCreatePost}
            >
              <FontAwesomeIcon icon={faPlus} />
              Tạo bài viết
            </Button>
          )}

          <PostFeedFilters
            semester={semesterFilter}
            major={majorFilter}
            onSemesterChange={handleSemesterChange}
            onMajorChange={handleMajorChange}
          />
        </div>
      </header>

      <div className={styles.list}>
        {loading ? (
          <PostFeedSkeleton />
        ) : error ? (
          <p className={styles.empty} role="alert">
            {error}
          </p>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              interactive={interactive}
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
        focusCommentsOnOpen={focusCommentsOnOpen}
        onClose={closeModal}
        onUpdate={handleUpdatePost}
        onPostChange={handlePostChange}
        onDelete={handleDeletePost}
        initialEditMode={editOnOpen}
        {...modalExtras}
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

export default PostFeedView;
