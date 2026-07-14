/**
 * @fileoverview Trang quản lý ghim bài — đầu feed + nổi bật sidebar, UX gọn (tab + list compact).
 *
 * @module features/moderator/featured/FeaturedPostsPage
 */

import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faStar,
  faThumbtack,
  faThumbsUp,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useToast } from "@/common/Toast/ToastProvider";
import Pagination from "@/common/Pagination/Pagination";
import ContentPostDetailPanel from "@/features/moderator/content/components/ContentPostDetailPanel/ContentPostDetailPanel";
import ModeratorEmptyState from "@/features/moderator/components/ModeratorEmptyState/ModeratorEmptyState";
import { ModeratorFeaturedWorkspaceSkeleton } from "@/features/moderator/components/ModeratorSkeleton/ModeratorSkeleton";
import ModeratorPageShell from "@/features/moderator/components/ModeratorPageShell/ModeratorPageShell";
import {
  enrichFeaturedPost,
  FEATURE_SEARCH_SORT_OPTIONS,
  FEED_PINNED_POSTS_INITIAL,
  filterSearchPosts,
  findFeaturedPost,
  loadFeaturedPostDetail,
  loadPinWorkspaceState,
  MAX_FEATURED_POSTS,
  MAX_FEED_PINNED_POSTS,
  PINNED_POSTS_INITIAL,
  SEARCH_POSTS_INITIAL,
  setPostFeatured,
  setPostPinned,
  tagToCategoryLabel,
} from "@/features/moderator/featured/featuredPostsData";
import styles from "./FeaturedPostsPage.module.css";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const STATS_EVENT = "sehub-moderator-stats-updated";
const SEARCH_DEBOUNCE_MS = 350;
const SEARCH_PAGE_SIZE = 5;

const FEATURED_CRUMBS = [
  { label: "Trang chủ", to: "/home" },
  { label: "Kiểm duyệt", to: "/moderator/content" },
  { label: "Quản lý ghim bài" },
];

function CompactPinRow({ post, isSelected, onSelect, onRemove, removeLabel }) {
  return (
    <div
      className={[styles.compactRow, isSelected ? styles.cardSelected : ""].filter(Boolean).join(" ")}
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
      <div className={styles.compactBody}>
        <p className={styles.compactTitle}>{post.title}</p>
        <p className={styles.compactMeta}>
          {post.authorName} · {post.timeLabel}
        </p>
      </div>
      <button
        type="button"
        className={styles.compactRemove}
        title={removeLabel}
        aria-label={removeLabel}
        onClick={(event) => {
          event.stopPropagation();
          onRemove(post.id);
        }}
      >
        <FontAwesomeIcon icon={faXmark} />
      </button>
    </div>
  );
}

function SearchResultRow({ post, isSelected, onSelect }) {
  return (
    <button
      type="button"
      className={[styles.resultRow, isSelected ? styles.cardSelected : ""].filter(Boolean).join(" ")}
      onClick={() => onSelect(post.id)}
      aria-pressed={isSelected}
    >
      <div className={styles.resultBody}>
        <p className={styles.resultTitle}>{post.title}</p>
        <p className={styles.resultMeta}>
          <span>{post.authorName}</span>
          <span className={styles.metaDot}>·</span>
          <span>{post.timeLabel}</span>
          <span className={styles.metaDot}>·</span>
          <span className={styles.resultLikes}>
            <FontAwesomeIcon icon={faThumbsUp} />
            {post.likes}
          </span>
        </p>
        {(post.isPinned || post.isFeatured) && (
          <div className={styles.statusChips}>
            {post.isPinned ? <span className={styles.chipFeed}>Đầu feed</span> : null}
            {post.isFeatured ? <span className={styles.chipSidebar}>Sidebar</span> : null}
          </div>
        )}
      </div>
    </button>
  );
}

function FeaturedPostsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("feed");
  const [feedPinned, setFeedPinned] = useState(USE_MOCK ? FEED_PINNED_POSTS_INITIAL : []);
  const [featured, setFeatured] = useState(USE_MOCK ? PINNED_POSTS_INITIAL : []);
  const [searchPool, setSearchPool] = useState(USE_MOCK ? SEARCH_POSTS_INITIAL : []);
  const [loading, setLoading] = useState(!USE_MOCK);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    if (USE_MOCK) return undefined;

    let cancelled = false;
    const searchTerm = query.trim();
    const delay = searchTerm ? SEARCH_DEBOUNCE_MS : 0;

    const timer = window.setTimeout(() => {
      if (!searchTerm) setLoading(true);

      loadPinWorkspaceState({ search: searchTerm || undefined })
        .then(({ feedPinned: nextFeed, featured: nextFeatured, searchPool: nextPool }) => {
          if (cancelled) return;
          if (searchTerm) {
            setSearchPool(nextPool);
          } else {
            setFeedPinned(nextFeed);
            setFeatured(nextFeatured);
            setSearchPool(nextPool);
          }
        })
        .catch((err) => {
          if (!cancelled && !searchTerm) {
            showToast(err.message ?? "Không tải được danh sách ghim bài.", "error");
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
      setSelectedPost(findFeaturedPost(selectedId, feedPinned, featured, searchPool));
      return undefined;
    }

    let cancelled = false;
    loadFeaturedPostDetail(selectedId)
      .then((post) => {
        if (cancelled) return;
        const inFeed = feedPinned.some((item) => item.id === selectedId);
        const inFeatured = featured.some((item) => item.id === selectedId);
        setSelectedPost({
          ...post,
          isPinned: inFeed || post.isPinned,
          isFeatured: inFeatured || post.isFeatured,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setSelectedPost(findFeaturedPost(selectedId, feedPinned, featured, searchPool));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId, feedPinned, featured, searchPool]);

  const feedPinnedIds = useMemo(() => new Set(feedPinned.map((post) => post.id)), [feedPinned]);
  const featuredIds = useMemo(() => new Set(featured.map((post) => post.id)), [featured]);
  const canFeedPinMore = feedPinned.length < MAX_FEED_PINNED_POSTS;
  const canFeatureMore = featured.length < MAX_FEATURED_POSTS;

  const searchResults = useMemo(
    () =>
      filterSearchPosts(searchPool, { query, sort }).map((post) => ({
        ...post,
        isPinned: feedPinnedIds.has(post.id) || post.isPinned,
        isFeatured: featuredIds.has(post.id) || post.isFeatured,
      })),
    [searchPool, query, sort, feedPinnedIds, featuredIds],
  );

  const totalPages = Math.max(1, Math.ceil(searchResults.length / SEARCH_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedResults = useMemo(() => {
    const start = (safePage - 1) * SEARCH_PAGE_SIZE;
    return searchResults.slice(start, start + SEARCH_PAGE_SIZE);
  }, [searchResults, safePage]);

  useEffect(() => {
    setSelectedId(null);
    setPage(1);
  }, [query, sort]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function syncSearchFlags(id, flags) {
    setSearchPool((prev) => {
      const exists = prev.some((item) => item.id === id);
      if (!exists && flags.sourcePost) {
        return [
          enrichFeaturedPost({
            ...flags.sourcePost,
            isFeatured: flags.isFeatured ?? false,
            isPinned: flags.isPinned ?? false,
          }),
          ...prev,
        ];
      }
      return prev.map((item) =>
        item.id === id
          ? {
              ...item,
              isFeatured: flags.isFeatured ?? item.isFeatured,
              isPinned: flags.isPinned ?? item.isPinned,
            }
          : item,
      );
    });
  }

  function handleUnfeature(id) {
    const post = featured.find((item) => item.id === id);
    if (!post) return;

    const applyLocal = () => {
      setFeatured((prev) => prev.filter((item) => item.id !== id));
      syncSearchFlags(id, {
        isFeatured: false,
        isPinned: feedPinnedIds.has(id),
        sourcePost: post,
      });
      showToast("Đã bỏ nổi bật sidebar.");
      window.dispatchEvent(new CustomEvent(STATS_EVENT));
    };

    if (USE_MOCK) {
      applyLocal();
      return;
    }

    setPostFeatured(id, false)
      .then(applyLocal)
      .catch((err) => showToast(err.message ?? "Không bỏ nổi bật được.", "error"));
  }

  function handleFeature(id) {
    if (!canFeatureMore) {
      showToast(`Chỉ được ghim tối đa ${MAX_FEATURED_POSTS} bài nổi bật sidebar.`);
      return;
    }
    if (featuredIds.has(id)) return;

    const post =
      searchPool.find((item) => item.id === id) ||
      feedPinned.find((item) => item.id === id) ||
      selectedPost;
    if (!post) return;

    const applyLocal = () => {
      setFeatured((prev) => [
        ...prev,
        enrichFeaturedPost({
          ...post,
          isFeatured: true,
          isPinned: feedPinnedIds.has(id) || post.isPinned,
          categoryLabel: post.categoryLabel ?? tagToCategoryLabel(post.tag),
          comments: post.comments ?? 0,
        }),
      ]);
      syncSearchFlags(id, { isFeatured: true, isPinned: feedPinnedIds.has(id) || post.isPinned });
      showToast("Đã ghim nổi bật lên sidebar.");
      window.dispatchEvent(new CustomEvent(STATS_EVENT));
      setActiveTab("sidebar");
    };

    if (USE_MOCK) {
      applyLocal();
      return;
    }

    setPostFeatured(id, true)
      .then(applyLocal)
      .catch((err) => showToast(err.message ?? "Không ghim nổi bật được.", "error"));
  }

  function handleFeedUnpin(id) {
    const post = feedPinned.find((item) => item.id === id);
    if (!post) return;

    const applyLocal = () => {
      setFeedPinned((prev) => prev.filter((item) => item.id !== id));
      syncSearchFlags(id, {
        isPinned: false,
        isFeatured: featuredIds.has(id),
        sourcePost: post,
      });
      showToast("Đã bỏ ghim đầu feed.");
    };

    if (USE_MOCK) {
      applyLocal();
      return;
    }

    setPostPinned(id, false)
      .then(applyLocal)
      .catch((err) => showToast(err.message ?? "Không bỏ ghim feed được.", "error"));
  }

  function handleFeedPin(id) {
    if (!canFeedPinMore) {
      showToast(`Chỉ được ghim tối đa ${MAX_FEED_PINNED_POSTS} bài đầu feed.`);
      return;
    }
    if (feedPinnedIds.has(id)) return;

    const post =
      searchPool.find((item) => item.id === id) ||
      featured.find((item) => item.id === id) ||
      selectedPost;
    if (!post) return;

    const applyLocal = () => {
      setFeedPinned((prev) => [
        ...prev,
        enrichFeaturedPost({
          ...post,
          isPinned: true,
          isFeatured: featuredIds.has(id) || post.isFeatured,
          categoryLabel: post.categoryLabel ?? tagToCategoryLabel(post.tag),
          comments: post.comments ?? 0,
        }),
      ]);
      syncSearchFlags(id, {
        isPinned: true,
        isFeatured: featuredIds.has(id) || post.isFeatured,
      });
      showToast("Đã ghim bài lên đầu feed.");
      setActiveTab("feed");
    };

    if (USE_MOCK) {
      applyLocal();
      return;
    }

    setPostPinned(id, true)
      .then(applyLocal)
      .catch((err) => showToast(err.message ?? "Không ghim đầu feed được.", "error"));
  }

  const selectedIsFeedPinned = selectedId ? feedPinnedIds.has(selectedId) : false;
  const selectedIsFeatured = selectedId ? featuredIds.has(selectedId) : false;
  const activeList = activeTab === "feed" ? feedPinned : featured;
  const activeEmpty =
    activeTab === "feed" ? "Chưa có bài ghim trên feed." : "Chưa có bài nổi bật.";

  return (
    <ModeratorPageShell
      title="Quản lý ghim bài"
      description="Chọn bài ở giữa → xem trước bên phải → ghim đầu feed hoặc nổi bật sidebar."
      crumbs={FEATURED_CRUMBS}
    >
      {loading ? (
        <ModeratorFeaturedWorkspaceSkeleton />
      ) : (
        <div className={styles.workspace}>
          <div className={styles.mainGrid}>
            <section className={styles.pinnedColumn} aria-label="Bài đang ghim">
              <div className={styles.tabBar} role="tablist" aria-label="Loại ghim">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "feed"}
                  className={`${styles.tab} ${activeTab === "feed" ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab("feed")}
                >
                  <FontAwesomeIcon icon={faThumbtack} />
                  Ghim trên feed
                  <span className={styles.tabCount}>
                    {feedPinned.length}/{MAX_FEED_PINNED_POSTS}
                  </span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "sidebar"}
                  className={`${styles.tab} ${activeTab === "sidebar" ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab("sidebar")}
                >
                  <FontAwesomeIcon icon={faStar} />
                  Nổi bật
                  <span className={styles.tabCount}>
                    {featured.length}/{MAX_FEATURED_POSTS}
                  </span>
                </button>
              </div>

              <p className={styles.sectionHint}>
                {activeTab === "feed"
                  ? "Bài được đẩy lên đầu bảng tin cộng đồng"
                  : "Bài hiện trong ô “Bài viết nổi bật” bên phải"}
              </p>

              {activeList.length === 0 ? (
                <ModeratorEmptyState message={activeEmpty} />
              ) : (
                <div className={styles.compactList}>
                  {activeList.map((post) => (
                    <CompactPinRow
                      key={`${activeTab}-${post.id}`}
                      post={post}
                      isSelected={selectedId === post.id}
                      onSelect={setSelectedId}
                      onRemove={activeTab === "feed" ? handleFeedUnpin : handleUnfeature}
                      removeLabel={activeTab === "feed" ? "Bỏ ghim feed" : "Bỏ nổi bật"}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className={styles.searchPanel} aria-labelledby="search-heading">
              <div className={styles.searchPanelHead}>
                <h2 id="search-heading" className={styles.sectionTitle}>
                  Tìm bài viết
                </h2>
                <p className={styles.sectionHint}>Nhấp bài để xem trước, rồi ghim ở cột phải.</p>

                <label className={styles.search}>
                  <FontAwesomeIcon icon={faMagnifyingGlass} className={styles.searchIcon} />
                  <input
                    type="search"
                    className={styles.searchInput}
                    placeholder="Nhập tiêu đề hoặc tác giả..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>

                <div className={styles.searchTabBar} role="tablist" aria-label="Sắp xếp">
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
                  <p className={styles.searchSummary}>
                    {searchResults.length} bài · trang {safePage}/{totalPages}
                  </p>
                ) : null}
              </div>

              <div className={styles.results}>
                {pagedResults.length === 0 ? (
                  <ModeratorEmptyState message="Không tìm thấy bài viết phù hợp." />
                ) : (
                  pagedResults.map((post) => (
                    <SearchResultRow
                      key={post.id}
                      post={post}
                      isSelected={selectedId === post.id}
                      onSelect={setSelectedId}
                    />
                  ))
                )}
              </div>

              {searchResults.length > 0 ? (
                <Pagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  ariaLabel="Phân trang danh sách bài viết"
                  alwaysShow
                  flush
                />
              ) : null}
            </section>
          </div>

          <aside className={styles.detailCol} aria-label="Chi tiết bài viết">
            <ContentPostDetailPanel
              item={selectedPost}
              mode="featured"
              isFeatured={selectedIsFeatured}
              isFeedPinned={selectedIsFeedPinned}
              canFeature={canFeatureMore || selectedIsFeatured}
              canFeedPin={canFeedPinMore || selectedIsFeedPinned}
              onFeature={handleFeature}
              onUnfeature={handleUnfeature}
              onFeedPin={handleFeedPin}
              onFeedUnpin={handleFeedUnpin}
            />
          </aside>
        </div>
      )}
    </ModeratorPageShell>
  );
}

export default FeaturedPostsPage;
