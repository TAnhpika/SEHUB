import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PostCard from "@/features/feed/PostCard/PostCard";
import SearchResourceCard from "@/features/search/SearchResourceCard/SearchResourceCard";
import SearchUserCard from "@/features/search/SearchUserCard/SearchUserCard";
import {
  SEARCH_TABS,
  getSearchCounts,
  searchAll,
  searchDocuments,
  searchFinalExams,
  searchPosts,
  searchPracticeExams,
  searchUsers,
} from "@/features/search/searchAllData";
import styles from "./SearchAllPage.module.css";

function SearchAllPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get("q")?.trim() ?? "";
  const activeTab = searchParams.get("tab") ?? "all";

  const results = useMemo(() => searchAll(query), [query]);
  const counts = useMemo(() => getSearchCounts(query), [query]);

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

  function renderPosts(posts) {
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

  function renderUsers(users) {
    if (users.length === 0) return null;

    return (
      <section className={styles.section} aria-labelledby="search-users-heading">
        <h2 id="search-users-heading" className={styles["section-title"]}>
          Người dùng
        </h2>
        <ul className={styles.list}>
          {users.map((user) => (
            <li key={user.id}>
              <SearchUserCard user={user} />
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

  function renderResults() {
    if (!query) {
      return (
        <p className={styles.empty}>
          Nhập từ khóa vào ô tìm kiếm phía trên để xem kết quả.
        </p>
      );
    }

    const tabResults = {
      blogs: results.blogs,
      documents: results.documents,
      exams: results.exams,
      practice: results.practice,
      users: results.users,
    };

    const currentItems =
      activeTab === "all"
        ? null
        : activeTab === "blogs"
          ? searchPosts(query)
          : activeTab === "documents"
            ? searchDocuments(query)
            : activeTab === "exams"
              ? searchFinalExams(query)
              : activeTab === "practice"
                ? searchPracticeExams(query)
                : searchUsers(query);

    if (activeTab !== "all") {
      const count = counts[activeTab] ?? 0;
      if (count === 0) {
        return <p className={styles.empty}>Không tìm thấy kết quả phù hợp.</p>;
      }

      if (activeTab === "blogs") {
        return renderPosts(currentItems);
      }
      if (activeTab === "users") {
        return renderUsers(currentItems);
      }
      if (activeTab === "documents") {
        return renderResources(currentItems, "Tài liệu", "search-documents-heading");
      }
      if (activeTab === "exams") {
        return renderResources(
          currentItems.map((item) => ({ ...item, typeLabel: "Đề thi" })),
          "Đề thi",
          "search-exams-heading",
        );
      }
      return renderResources(
        currentItems.map((item) => ({ ...item, typeLabel: "Thực hành" })),
        "Thực hành",
        "search-practice-heading",
      );
    }

    if (counts.all === 0) {
      return <p className={styles.empty}>Không tìm thấy kết quả phù hợp.</p>;
    }

    return (
      <>
        {renderPosts(tabResults.blogs)}
        {renderResources(tabResults.documents, "Tài liệu", "search-documents-heading")}
        {renderResources(
          tabResults.exams.map((item) => ({ ...item, typeLabel: "Đề thi" })),
          "Đề thi",
          "search-exams-heading",
        )}
        {renderResources(
          tabResults.practice.map((item) => ({ ...item, typeLabel: "Thực hành" })),
          "Thực hành",
          "search-practice-heading",
        )}
        {renderUsers(tabResults.users)}
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
