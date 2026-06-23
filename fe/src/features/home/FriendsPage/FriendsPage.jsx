import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import FriendResultCard from "@/features/home/FriendResultCard/FriendResultCard";
import { searchMembers } from "@/features/home/friendsData";
import styles from "./FriendsPage.module.css";

function FriendsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSearch(event) {
    event.preventDefault();
    const trimmed = query.trim();
    setHasSearched(true);
    setError(null);

    if (!trimmed) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const data = await searchMembers(trimmed);
      setResults(data.items);
    } catch (err) {
      setResults([]);
      setError(err.message ?? "Không tìm kiếm được thành viên.");
    } finally {
      setLoading(false);
    }
  }

  function handleFollowChange(userId, followState) {
    setResults((current) =>
      current.map((user) =>
        user.userId === userId
          ? {
              ...user,
              isFollowing: followState.isFollowing,
            }
          : user,
      ),
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tìm và kết nối với bạn bè trong cộng đồng SE HUB.</h1>
        <p className={styles.subtitle}>
          Tìm kiếm và kết nối với các thành viên khác. Click Follow hoặc Message để tương tác
          (yêu cầu đăng nhập).
        </p>

        <form className={styles.search} onSubmit={handleSearch}>
          <input
            type="search"
            className={styles["search-input"]}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nhập username hoặc tên để tìm kiếm..."
            aria-label="Tìm kiếm bạn bè"
          />
          <button type="submit" className={styles["search-btn"]} aria-label="Tìm kiếm" disabled={loading}>
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </button>
        </form>
      </header>

      {loading && (
        <p className={styles.empty} aria-live="polite">
          Đang tìm kiếm...
        </p>
      )}

      {error && !loading && (
        <p className={styles.empty} role="alert">
          {error}
        </p>
      )}

      {hasSearched && !loading && !error && (
        <section className={styles.results} aria-live="polite">
          {results.length > 0 ? (
            <ul className={styles.list}>
              {results.map((user) => (
                <li key={user.userId}>
                  <FriendResultCard user={user} onFollowChange={handleFollowChange} />
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>Không tìm thấy thành viên phù hợp.</p>
          )}
        </section>
      )}
    </div>
  );
}

export default FriendsPage;
