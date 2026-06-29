import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import HeaderUserActions from "@/common/Header/HeaderUserActions/HeaderUserActions";
import { useMainShellOptional } from "@/common/context/MainShellContext";
import logoSrc from "@/img/logo.png";
import styles from "./MainHeader.module.css";

function MainHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const mainShell = useMainShellOptional();
  const brandTo = "/home";
  const isSearchPage = location.pathname === "/home/search";
  const [searchQuery, setSearchQuery] = useState(() =>
    isSearchPage ? (searchParams.get("q") ?? "") : "",
  );
  const searchInputRef = useRef(null);
  const skipSearchSyncRef = useRef(false);

  useEffect(() => {
    if (skipSearchSyncRef.current) {
      skipSearchSyncRef.current = false;
      return;
    }
    if (isSearchPage) {
      setSearchQuery(searchParams.get("q") ?? "");
    }
  }, [isSearchPage, searchParams]);

  function handleSearchSubmit(event) {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    searchInputRef.current?.blur();
    skipSearchSyncRef.current = true;
    navigate(`/home/search?q=${encodeURIComponent(trimmed)}`);
    setSearchQuery("");
  }

  function handleMobileSearch() {
    navigate("/home/search");
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {mainShell ? (
          <button
            type="button"
            className={styles.menuBtn}
            aria-label="Mở menu điều hướng"
            onClick={() => mainShell.setSidebarOpen(true)}
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
        ) : null}

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
              ref={searchInputRef}
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
          <button
            type="button"
            className={styles.searchBtn}
            aria-label="Tìm kiếm"
            onClick={handleMobileSearch}
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </button>
          <HeaderUserActions />
        </div>
      </div>
    </header>
  );
}

export default MainHeader;
