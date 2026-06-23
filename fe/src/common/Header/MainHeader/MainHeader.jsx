import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import HeaderUserActions from "@/common/Header/HeaderUserActions/HeaderUserActions";
import { useAuth } from "@/context";
import logoSrc from "@/img/logo.png";
import styles from "./MainHeader.module.css";

function MainHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAdmin } = useAuth();
  const brandTo = isAdmin ? "/admin" : "/home";
  const isSearchPage = location.pathname === "/home/search";
  const [searchQuery, setSearchQuery] = useState(() =>
    isSearchPage ? (searchParams.get("q") ?? "") : "",
  );

  useEffect(() => {
    if (isSearchPage) {
      setSearchQuery(searchParams.get("q") ?? "");
    }
  }, [isSearchPage, searchParams]);

  function handleSearchSubmit(event) {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    navigate(`/home/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to={brandTo} className={styles.brand}>
          <img
            src={logoSrc}
            alt=""
            className={styles["brand-logo"]}
            decoding="async"
            aria-hidden="true"
          />
          <span className={styles["brand-text"]}>SEHub</span>
        </Link>

        <form className={styles["search-wrap"]} onSubmit={handleSearchSubmit}>
          <div className={styles.search}>
            <FontAwesomeIcon icon={faMagnifyingGlass} className={styles["search-icon"]} />
            <input
              type="search"
              className={styles["search-input"]}
              placeholder="Tìm kiếm..."
              aria-label="Tìm kiếm"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </form>

        <div className={styles.actions}>
          <HeaderUserActions />
        </div>
      </div>
    </header>
  );
}

export default MainHeader;
