import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComment,
  faHeart,
  faMagnifyingGlass,
  faThumbtack,
  faThumbsUp,
} from "@fortawesome/free-solid-svg-icons";
import { useToast } from "@/common/Toast/ToastProvider";
import ModeratorEmptyState from "@/features/moderator/components/ModeratorEmptyState/ModeratorEmptyState";
import ModeratorPageShell from "@/features/moderator/components/ModeratorPageShell/ModeratorPageShell";
import {
  FEATURE_TAG_FILTERS,
  filterSearchPosts,
  MAX_PINNED_POSTS,
  PINNED_POSTS_INITIAL,
  SEARCH_POSTS_INITIAL,
} from "@/features/moderator/featured/featuredPostsData";
import styles from "./FeaturedPostsPage.module.css";

const FEATURED_CRUMBS = [
  { label: "Trang chủ", to: "/home" },
  { label: "Kiểm duyệt", to: "/moderator/content" },
  { label: "Bài viết nổi bật" },
];

function PinnedCard({ post, onUnpin }) {
  return (
    <article className={styles.pinnedCard}>
      <div className={styles.pinnedAccent} aria-hidden />
      <div className={styles.pinnedTop}>
        <div className={styles.pinnedAuthor}>
          <div className={styles.pinnedAvatar} aria-hidden>
            {post.authorInitial}
          </div>
          <div>
            <p className={styles.pinnedAuthorName}>{post.authorName}</p>
            <p className={styles.pinnedMeta}>
              {post.timeLabel} • {post.categoryLabel}
            </p>
          </div>
        </div>
        <FontAwesomeIcon icon={faThumbtack} className={styles.pinIcon} aria-hidden />
      </div>
      <h3 className={styles.pinnedTitle}>{post.title}</h3>
      <p className={styles.pinnedExcerpt}>{post.excerpt}</p>
      <footer className={styles.pinnedFooter}>
        <div className={styles.stats}>
          <span className={styles.stat}>
            <FontAwesomeIcon icon={faHeart} />
            {post.likes}
          </span>
          <span className={styles.stat}>
            <FontAwesomeIcon icon={faComment} />
            {post.comments}
          </span>
        </div>
        <button type="button" className={styles.unpinBtn} onClick={() => onUnpin(post.id)}>
          Bỏ ghim
        </button>
      </footer>
    </article>
  );
}

function SearchResultCard({ post, canPin, onPin }) {
  return (
    <article className={styles.resultCard}>
      <div className={styles.resultHeader}>
        <h4 className={styles.resultTitle}>{post.title}</h4>
        <button
          type="button"
          className={styles.pinBtn}
          disabled={!canPin}
          onClick={() => onPin(post.id)}
        >
          <FontAwesomeIcon icon={faThumbtack} />
          Ghim bài
        </button>
      </div>
      <div className={styles.resultMeta}>
        <span className={styles.resultAvatar} aria-hidden>
          {post.authorInitial}
        </span>
        <span>{post.authorName}</span>
        <span className={styles.metaDot}>•</span>
        <span>{post.timeLabel}</span>
        <span className={styles.metaDot}>•</span>
        <span className={styles.resultLikes}>
          <FontAwesomeIcon icon={faThumbsUp} />
          {post.likes}
        </span>
      </div>
    </article>
  );
}

function FeaturedPostsPage() {
  const { showToast } = useToast();
  const [pinned, setPinned] = useState(PINNED_POSTS_INITIAL);
  const [searchPool, setSearchPool] = useState(SEARCH_POSTS_INITIAL);
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("all");

  const pinnedIds = useMemo(() => new Set(pinned.map((post) => post.id)), [pinned]);
  const canPinMore = pinned.length < MAX_PINNED_POSTS;

  const searchResults = useMemo(
    () => filterSearchPosts(searchPool, { query, tagFilter, pinnedIds }),
    [searchPool, query, tagFilter, pinnedIds],
  );

  const pinCounter = (
    <span className={styles.countBadge}>
      {pinned.length}/{MAX_PINNED_POSTS} bài
    </span>
  );

  function handleUnpin(id) {
    const post = pinned.find((item) => item.id === id);
    if (!post) return;

    setPinned((prev) => prev.filter((item) => item.id !== id));
    setSearchPool((prev) => {
      if (prev.some((item) => item.id === id)) return prev;
      return [
        {
          id: post.id,
          authorName: post.authorName,
          authorInitial: post.authorInitial,
          timeLabel: post.timeLabel,
          tag: post.tag ?? "announcement",
          title: post.title,
          likes: post.likes,
        },
        ...prev,
      ];
    });
    showToast("Đã bỏ ghim bài viết.");
  }

  function handlePin(id) {
    if (!canPinMore) {
      showToast(`Chỉ được ghim tối đa ${MAX_PINNED_POSTS} bài.`);
      return;
    }

    const post = searchPool.find((item) => item.id === id);
    if (!post || pinnedIds.has(id)) return;

    setSearchPool((prev) => prev.filter((item) => item.id !== id));
    setPinned((prev) => [
      ...prev,
      {
        id: post.id,
        authorName: post.authorName,
        authorInitial: post.authorInitial,
        timeLabel: post.timeLabel,
        categoryLabel:
          post.tag === "document"
            ? "Tài liệu"
            : post.tag === "hk231"
              ? "Học kỳ 231"
              : "Thông báo",
        tag: post.tag,
        title: post.title,
        excerpt: "Nội dung bài viết sẽ hiển thị đầy đủ khi nối API.",
        likes: post.likes,
        comments: 0,
      },
    ]);
    showToast("Đã ghim bài viết lên sidebar cộng đồng (mock).");
  }

  return (
    <ModeratorPageShell
      title="Quản lý bài viết nổi bật"
      description="Ghim các tài liệu và thông báo quan trọng lên đầu bảng tin cộng đồng."
      crumbs={FEATURED_CRUMBS}
      actions={pinCounter}
    >
      <div className={styles.grid}>
        <section className={styles.pinnedColumn} aria-labelledby="pinned-heading">
          <div className={styles.pinnedHeading}>
            <h2 id="pinned-heading" className={styles.sectionTitle}>
              Đang được ghim
            </h2>
          </div>

          {pinned.length === 0 ? (
            <ModeratorEmptyState message="Chưa có bài viết nào được ghim." />
          ) : (
            <div className={styles.pinnedList}>
              {pinned.map((post) => (
                <PinnedCard key={post.id} post={post} onUnpin={handleUnpin} />
              ))}
            </div>
          )}
        </section>

        <section className={styles.searchPanel} aria-labelledby="search-heading">
          <h2 id="search-heading" className={styles.sectionTitle}>
            Tìm bài viết nổi bật
          </h2>

          <label className={styles.search}>
            <FontAwesomeIcon icon={faMagnifyingGlass} className={styles.searchIcon} />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Nhập tiêu đề hoặc tác giả bài viết..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <div className={styles.tagFilters} role="tablist" aria-label="Lọc theo chủ đề">
            {FEATURE_TAG_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                role="tab"
                aria-selected={tagFilter === filter.value}
                className={`${styles.tag} ${tagFilter === filter.value ? styles.tagActive : ""}`}
                onClick={() => setTagFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className={styles.results}>
            {searchResults.length === 0 ? (
              <ModeratorEmptyState message="Không tìm thấy bài viết phù hợp hoặc tất cả đã được ghim." />
            ) : (
              searchResults.map((post) => (
                <SearchResultCard
                  key={post.id}
                  post={post}
                  canPin={canPinMore}
                  onPin={handlePin}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </ModeratorPageShell>
  );
}

export default FeaturedPostsPage;
