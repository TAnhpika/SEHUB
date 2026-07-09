import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComment,
  faHeart,
  faMagnifyingGlass,
  faThumbtack,
  faThumbsUp,
} from "@fortawesome/free-solid-svg-icons";
import { useToast } from "@/common/Toast/ToastProvider";
import ContentPostDetailPanel from "@/features/moderator/content/components/ContentPostDetailPanel/ContentPostDetailPanel";
import ModeratorEmptyState from "@/features/moderator/components/ModeratorEmptyState/ModeratorEmptyState";
import { ModeratorFeaturedWorkspaceSkeleton } from "@/features/moderator/components/ModeratorSkeleton/ModeratorSkeleton";
import ModeratorPageShell from "@/features/moderator/components/ModeratorPageShell/ModeratorPageShell";
import {
  enrichFeaturedPost,
  FEATURE_SEARCH_SORT_OPTIONS,
  filterSearchPosts,
  findFeaturedPost,
  loadFeaturedPostDetail,
  loadFeaturedPostsState,
  MAX_PINNED_POSTS,
  PINNED_POSTS_INITIAL,
  SEARCH_POSTS_INITIAL,
  setPostFeatured,
  tagToCategoryLabel,
} from "@/features/moderator/featured/featuredPostsData";
import styles from "./FeaturedPostsPage.module.css";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const STATS_EVENT = "sehub-moderator-stats-updated";
const SEARCH_DEBOUNCE_MS = 350;

const FEATURED_CRUMBS = [
  { label: "Trang chủ", to: "/home" },
  { label: "Kiểm duyệt", to: "/moderator/content" },
  { label: "Bài viết nổi bật" },
];

function PinnedCard({ post, isSelected, onSelect, onUnpin }) {
  return (
    <article
      className={[styles.pinnedCard, isSelected ? styles.cardSelected : ""].filter(Boolean).join(" ")}
      onClick={() => onSelect(post.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(post.id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
    >
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
        <button
          type="button"
          className={styles.unpinBtn}
          onClick={(event) => {
            event.stopPropagation();
            onUnpin(post.id);
          }}
        >
          Bỏ ghim
        </button>
      </footer>
    </article>
  );
}

function SearchResultCard({ post, isSelected, canPin, onSelect, onPin }) {
  return (
    <article
      className={[styles.resultCard, isSelected ? styles.cardSelected : ""].filter(Boolean).join(" ")}
      onClick={() => onSelect(post.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(post.id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
    >
      <div className={styles.resultHeader}>
        <h4 className={styles.resultTitle}>{post.title}</h4>
        <button
          type="button"
          className={styles.pinBtn}
          disabled={!canPin}
          onClick={(event) => {
            event.stopPropagation();
            onPin(post.id);
          }}
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
  const [pinned, setPinned] = useState(USE_MOCK ? PINNED_POSTS_INITIAL : []);
  const [searchPool, setSearchPool] = useState(USE_MOCK ? SEARCH_POSTS_INITIAL : []);
  const [loading, setLoading] = useState(!USE_MOCK);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [selectedId, setSelectedId] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    if (USE_MOCK) return undefined;

    let cancelled = false;
    const searchTerm = query.trim();
    const delay = searchTerm ? SEARCH_DEBOUNCE_MS : 0;

    const timer = window.setTimeout(() => {
      if (!searchTerm) {
        setLoading(true);
      }

      loadFeaturedPostsState({ search: searchTerm || undefined })
        .then(({ pinned: nextPinned, searchPool: nextPool }) => {
          if (cancelled) return;
          if (searchTerm) {
            setSearchPool(nextPool);
          } else {
            setPinned(nextPinned);
            setSearchPool(nextPool);
          }
        })
        .catch((err) => {
          if (!cancelled && !searchTerm) {
            showToast(err.message ?? "Không tải được bài viết nổi bật.", "error");
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, showToast]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedPost(null);
      return undefined;
    }

    if (USE_MOCK) {
      setSelectedPost(findFeaturedPost(selectedId, pinned, searchPool));
      return undefined;
    }

    let cancelled = false;
    loadFeaturedPostDetail(selectedId)
      .then((post) => {
        if (!cancelled) setSelectedPost(post);
      })
      .catch(() => {
        if (!cancelled) {
          setSelectedPost(findFeaturedPost(selectedId, pinned, searchPool));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId, pinned, searchPool]);

  const pinnedIds = useMemo(() => new Set(pinned.map((post) => post.id)), [pinned]);
  const canPinMore = pinned.length < MAX_PINNED_POSTS;

  const searchResults = useMemo(
    () => filterSearchPosts(searchPool, { query, sort, pinnedIds }),
    [searchPool, query, sort, pinnedIds],
  );

  useEffect(() => {
    setSelectedId(null);
  }, [query, sort]);

  function handleUnpin(id) {
    const post = pinned.find((item) => item.id === id);
    if (!post) return;

    const applyLocal = () => {
      setPinned((prev) => prev.filter((item) => item.id !== id));
      setSearchPool((prev) => {
        if (prev.some((item) => item.id === id)) return prev;
        return [enrichFeaturedPost({ ...post, isFeatured: false }), ...prev];
      });
      if (selectedId === id) setSelectedId(null);
      showToast("Đã bỏ ghim bài viết.");
    };

    if (USE_MOCK) {
      applyLocal();
      return;
    }

    setPostFeatured(id, false)
      .then(applyLocal)
      .catch((err) => showToast(err.message ?? "Không bỏ ghim được bài viết.", "error"));
  }

  function handlePin(id) {
    if (!canPinMore) {
      showToast(`Chỉ được ghim tối đa ${MAX_PINNED_POSTS} bài.`);
      return;
    }

    const post = searchPool.find((item) => item.id === id);
    if (!post || pinnedIds.has(id)) return;

    const applyLocal = () => {
      setSearchPool((prev) => prev.filter((item) => item.id !== id));
      setPinned((prev) => [
        ...prev,
        enrichFeaturedPost({
          ...post,
          isFeatured: true,
          categoryLabel: tagToCategoryLabel(post.tag),
          comments: post.comments ?? 0,
        }),
      ]);
      showToast("Đã ghim bài viết lên sidebar cộng đồng.");
      window.dispatchEvent(new CustomEvent(STATS_EVENT));
    };

    if (USE_MOCK) {
      applyLocal();
      return;
    }

    setPostFeatured(id, true)
      .then(applyLocal)
      .catch((err) => showToast(err.message ?? "Không ghim được bài viết.", "error"));
  }

  return (
    <ModeratorPageShell
      title="Quản lý bài viết nổi bật"
      description="Ghim các tài liệu và thông báo quan trọng lên đầu bảng tin cộng đồng. Nhấp bài viết để xem chi tiết trước khi ghim."
      crumbs={FEATURED_CRUMBS}
    >
      {loading ? <ModeratorFeaturedWorkspaceSkeleton /> : (
      <div className={styles.workspace}>
        <div className={styles.mainGrid}>
          <section className={styles.pinnedColumn} aria-labelledby="pinned-heading">
            <div className={styles.pinnedHeading}>
              <div className={styles.pinnedTitleRow}>
                <h2 id="pinned-heading" className={styles.sectionTitle}>
                  Đang được ghim
                </h2>
                <span className={styles.countBadge}>
                  {pinned.length}/{MAX_PINNED_POSTS} bài
                </span>
              </div>
            </div>

            {pinned.length === 0 ? (
              <ModeratorEmptyState message="Chưa có bài viết nào được ghim." />
            ) : (
              <div className={styles.pinnedList}>
                {pinned.map((post) => (
                  <PinnedCard
                    key={post.id}
                    post={post}
                    isSelected={selectedId === post.id}
                    onSelect={setSelectedId}
                    onUnpin={handleUnpin}
                  />
                ))}
              </div>
            )}
          </section>

          <section className={styles.searchPanel} aria-labelledby="search-heading">
            <div className={styles.searchPanelHead}>
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

              <div className={styles.searchTabBar} role="tablist" aria-label="Sắp xếp kết quả tìm kiếm">
                {FEATURE_SEARCH_SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={sort === option.value}
                    className={`${styles.searchTab} ${sort === option.value ? styles.searchTabActive : ""}`}
                    onClick={() => setSort(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {searchResults.length > 0 ? (
                <p className={styles.searchSummary}>{searchResults.length} bài</p>
              ) : null}
            </div>

            <div className={styles.results}>
              {searchResults.length === 0 ? (
                <ModeratorEmptyState message="Không tìm thấy bài viết phù hợp hoặc tất cả đã được ghim." />
              ) : (
                searchResults.map((post) => (
                  <SearchResultCard
                    key={post.id}
                    post={post}
                    isSelected={selectedId === post.id}
                    canPin={canPinMore}
                    onSelect={setSelectedId}
                    onPin={handlePin}
                  />
                ))
              )}
            </div>
          </section>
        </div>

        <aside className={styles.detailCol} aria-label="Chi tiết bài viết">
          <ContentPostDetailPanel
            item={selectedPost}
            mode="featured"
            isPinned={selectedPost ? pinnedIds.has(selectedPost.id) : false}
            canPin={canPinMore}
            onPin={handlePin}
            onUnpin={handleUnpin}
          />
        </aside>
      </div>
      )}
    </ModeratorPageShell>
  );
}

export default FeaturedPostsPage;
