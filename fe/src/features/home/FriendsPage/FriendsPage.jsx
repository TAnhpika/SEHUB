import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import FriendResultCard from "@/features/home/FriendResultCard/FriendResultCard";
import { searchFriends } from "@/features/home/friendsData";
import styles from "./FriendsPage.module.css";

function FriendsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  function handleSearch(event) {
    event.preventDefault();
    const trimmed = query.trim();
    setHasSearched(true);
    setResults(searchFriends(trimmed));
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
            placeholder="Nhập username để tìm kiếm..."
            aria-label="Tìm kiếm bạn bè"
          />
          <button type="submit" className={styles["search-btn"]} aria-label="Tìm kiếm">
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </button>
        </form>
      </header>

      {hasSearched && (
        <section className={styles.results} aria-live="polite">
          {results.length > 0 ? (
            <ul className={styles.list}>
              {results.map((user) => (
                <li key={user.id}>
                  <FriendResultCard user={user} />
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
