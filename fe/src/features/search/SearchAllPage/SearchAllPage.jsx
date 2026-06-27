import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PostCard from "@/features/feed/PostCard/PostCard";
import SearchResourceCard from "@/features/search/SearchResourceCard/SearchResourceCard";
import SearchUserCard from "@/features/search/SearchUserCard/SearchUserCard";
import {
  SEARCH_TABS,
  getSearchCounts,
  searchDocuments,
  searchFinalExams,
  searchPosts,
  searchPracticeExams,
  searchLocalContent,
  searchUsers,
} from "@/features/search/searchAllData";
import styles from "./SearchAllPage.module.css";

const EMPTY_LOCAL_RESULTS = {
  documents: [],
  exams: [],
  practice: [],
};

function SearchAllPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get("q")?.trim() ?? "";
  const activeTab = searchParams.get("tab") ?? "all";

  const [localResults, setLocalResults] = useState(EMPTY_LOCAL_RESULTS);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [blogResults, setBlogResults] = useState([]);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [blogsError, setBlogsError] = useState(null);
  const [userResults, setUserResults] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [counts, setCounts] = useState({
    all: 0,
    blogs: 0,
    documents: 0,
    exams: 0,
    practice: 0,
    users: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchLocalResults() {
      if (!query) {
        setLocalResults(EMPTY_LOCAL_RESULTS);
        setLocalError(null);
        return;
      }

      setLocalLoading(true);
      setLocalError(null);

      try {
        const results = await searchLocalContent(query);
        if (!cancelled) {
          setLocalResults(results);
        }
      } catch (err) {
        if (!cancelled) {
          setLocalResults(EMPTY_LOCAL_RESULTS);
          setLocalError(err.message ?? "Không tải được kết quả tài liệu và đề thi.");
        }
      } finally {
        if (!cancelled) {
          setLocalLoading(false);
        }
      }
    }

    fetchLocalResults();

    return () => {
      cancelled = true;
    };
  }, [query]);

  useEffect(() => {
    let cancelled = false;

    async function fetchBlogs() {
      if (!query) {
        setBlogResults([]);
        setBlogsError(null);
        return;
      }

      setBlogsLoading(true);
      setBlogsError(null);

      try {
        const posts = await searchPosts(query);
        if (!cancelled) {
          setBlogResults(posts);
        }
      } catch (err) {
        if (!cancelled) {
          setBlogResults([]);
          setBlogsError(err.message ?? "Không tải được kết quả blogs.");
        }
      } finally {
        if (!cancelled) {
          setBlogsLoading(false);
        }
      }
    }

    fetchBlogs();

    return () => {
      cancelled = true;
    };
  }, [query]);

  useEffect(() => {
    let cancelled = false;

    async function fetchUsers() {
      if (!query) {
        setUserResults([]);
        setUsersError(null);
        return;
      }

      setUsersLoading(true);
      setUsersError(null);

      try {
        const data = await searchUsers(query);
        if (!cancelled) {
          setUserResults(data.items);
        }
      } catch (err) {
        if (!cancelled) {
          setUserResults([]);
          setUsersError(err.message ?? "Không tải được kết quả người dùng.");
        }
      } finally {
        if (!cancelled) {
          setUsersLoading(false);
        }
      }
    }

    fetchUsers();

    return () => {
      cancelled = true;
    };
  }, [query]);

  useEffect(() => {
    let cancelled = false;

    async function updateCounts() {
      if (!query) {
        setCounts({ all: 0, blogs: 0, documents: 0, exams: 0, practice: 0, users: 0 });
        return;
      }

      const nextCounts = await getSearchCounts(query, {
        blogCount: blogResults.length,
        userCount: userResults.length,
      });

      if (!cancelled) {
        setCounts(nextCounts);
      }
    }

    updateCounts();

    return () => {
      cancelled = true;
    };
  }, [query, blogResults.length, userResults.length, localResults]);

  const tabDocuments = useMemo(
    () => (activeTab === "documents" ? localResults.documents : []),
    [activeTab, localResults.documents],
  );
  const tabExams = useMemo(
    () => (activeTab === "exams" ? localResults.exams : []),
    [activeTab, localResults.exams],
  );
  const tabPractice = useMemo(
    () => (activeTab === "practice" ? localResults.practice : []),
    [activeTab, localResults.practice],
  );

  function handleTabChange(tabId) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tabId === "all") {
        next.delete("tab");
      } else {
        next.set("tab", tabId);
      }
      return next;
    });
  }

  function handleOpenPost(post) {
    navigate(`/home/posts/${post.id}`);
  }

  function handleUserFollowChange(userId, followState) {
    setUserResults((current) =>
      current.map((user) =>
        user.userId === userId ? { ...user, isFollowing: followState.isFollowing } : user,
      ),
    );
  }

  function renderPosts(posts, { showLoading = false, showError = null } = {}) {
    if (showLoading) {
      return <p className={styles.empty}>Đang tải blogs...</p>;
    }

    if (showError) {
      return (
        <p className={styles.empty} role="alert">
          {showError}
        </p>
      );
    }

    if (posts.length === 0) return null;

    return (
      <section className={styles.section} aria-labelledby="search-blogs-heading">
        <h2 id="search-blogs-heading" className={styles["section-title"]}>
          Blogs
        </h2>
        <ul className={styles.list}>
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} interactive onOpen={handleOpenPost} />
            </li>
          ))}
        </ul>
      </section>
    );
  }

  function renderUsers(users, { showLoading = false, showError = null } = {}) {
    if (showLoading) {
      return <p className={styles.empty}>Đang tải người dùng...</p>;
    }

    if (showError) {
      return (
        <p className={styles.empty} role="alert">
          {showError}
        </p>
      );
    }

    if (users.length === 0) return null;

    return (
      <section className={styles.section} aria-labelledby="search-users-heading">
        <h2 id="search-users-heading" className={styles["section-title"]}>
          Người dùng
        </h2>
        <ul className={styles.list}>
          {users.map((user) => (
            <li key={user.userId}>
              <SearchUserCard user={user} onFollowChange={handleUserFollowChange} />
            </li>
          ))}
        </ul>
      </section>
    );
  }

  function renderResources(items, title, headingId) {
    if (items.length === 0) return null;

    return (
      <section className={styles.section} aria-labelledby={headingId}>
        <h2 id={headingId} className={styles["section-title"]}>
          {title}
        </h2>
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={`${item.id}-${item.detailPath}`}>
              <SearchResourceCard item={item} />
            </li>
          ))}
        </ul>
      </section>
    );
  }

  function renderLocalLoadingOrError() {
    if (localLoading) {
      return <p className={styles.empty}>Đang tải tài liệu và đề thi...</p>;
    }

    if (localError) {
      return (
        <p className={styles.empty} role="alert">
          {localError}
        </p>
      );
    }

    return null;
  }

  function renderResults() {
    if (!query) {
      return (
        <p className={styles.empty}>
          Nhập từ khóa vào ô tìm kiếm phía trên để xem kết quả.
        </p>
      );
    }

    if (activeTab === "users") {
      if (usersLoading) {
        return renderUsers([], { showLoading: true });
      }

      if (usersError) {
        return renderUsers([], { showError: usersError });
      }

      if (userResults.length === 0) {
        return <p className={styles.empty}>Không tìm thấy kết quả phù hợp.</p>;
      }

      return renderUsers(userResults);
    }

    if (activeTab !== "all") {
      if (activeTab === "blogs") {
        if (blogsLoading) {
          return renderPosts([], { showLoading: true });
        }

        if (blogsError) {
          return renderPosts([], { showError: blogsError });
        }

        if (blogResults.length === 0) {
          return <p className={styles.empty}>Không tìm thấy kết quả phù hợp.</p>;
        }

        return renderPosts(blogResults);
      }

      if (localLoading || localError) {
        return renderLocalLoadingOrError();
      }

      const count = counts[activeTab] ?? 0;
      if (count === 0) {
        return <p className={styles.empty}>Không tìm thấy kết quả phù hợp.</p>;
      }

      if (activeTab === "documents") {
        return renderResources(tabDocuments, "Tài liệu", "search-documents-heading");
      }
      if (activeTab === "exams") {
        return renderResources(
          tabExams.map((item) => ({ ...item, typeLabel: "Đề thi" })),
          "Đề thi",
          "search-exams-heading",
        );
      }
      return renderResources(
        tabPractice.map((item) => ({ ...item, typeLabel: "Thực hành" })),
        "Thực hành",
        "search-practice-heading",
      );
    }

    if (counts.all === 0 && !usersLoading && !blogsLoading && !localLoading) {
      return <p className={styles.empty}>Không tìm thấy kết quả phù hợp.</p>;
    }

    return (
      <>
        {renderPosts(blogResults, { showLoading: blogsLoading, showError: blogsError })}
        {renderLocalLoadingOrError()}
        {!localLoading && !localError ? (
          <>
            {renderResources(localResults.documents, "Tài liệu", "search-documents-heading")}
            {renderResources(
              localResults.exams.map((item) => ({ ...item, typeLabel: "Đề thi" })),
              "Đề thi",
              "search-exams-heading",
            )}
            {renderResources(
              localResults.practice.map((item) => ({ ...item, typeLabel: "Thực hành" })),
              "Thực hành",
              "search-practice-heading",
            )}
          </>
        ) : null}
        {renderUsers(userResults, { showLoading: usersLoading, showError: usersError })}
      </>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles["header-text"]}>
          <h1 className={styles.title}>
            {query ? (
              <>
                Kết quả tìm kiếm cho &ldquo;<span className={styles.query}>{query}</span>&rdquo;
              </>
            ) : (
              "Tìm kiếm tổng"
            )}
          </h1>
          {query ? (
            <p className={styles.subtitle}>
              Tìm thấy <strong>{counts.all}</strong> kết quả
            </p>
          ) : (
            <p className={styles.subtitle}>
              Tìm blogs, tài liệu, đề thi, thực hành và người dùng trong SEHub.
            </p>
          )}
        </div>
      </header>

      {query ? (
        <nav className={styles.tabs} aria-label="Lọc kết quả tìm kiếm">
          {SEARCH_TABS.map((tab) => {
            const count = counts[tab.id] ?? 0;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                className={`${styles.tab} ${isActive ? styles["tab-active"] : ""}`}
                onClick={() => handleTabChange(tab.id)}
                aria-pressed={isActive}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </nav>
      ) : null}

      <div className={styles.results}>{renderResults()}</div>
    </div>
  );
}

export default SearchAllPage;
