const SEGMENTS = {
  review: "final-exam",
  practice: "practical-exam",
  documents: "documents",
};

const LEGACY_PRACTICE_SEGMENT = "pratical-exam";

/**
 * @param {"review" | "practice" | "documents"} pageKey
 * @param {"community" | "home"} [scope="community"]
 */
export function getSubjectCatalogPath(pageKey, scope = "community") {
  const base = scope === "home" ? "/home" : "/community";
  return `${base}/${SEGMENTS[pageKey]}`;
}

/** @param {string} pathname */
export function getSubjectScopeFromPath(pathname) {
  return pathname.startsWith("/home/") ? "home" : "community";
}

const HOME_SUBJECT_PREFIXES = [
  "/home/final-exam",
  "/home/practical-exam",
  "/home/pratical-exam",
  "/home/documents",
];

const SUBJECT_CONTENT_PREFIXES = [
  "/community/final-exam",
  "/community/practical-exam",
  "/community/pratical-exam",
  "/community/documents",
  ...HOME_SUBJECT_PREFIXES,
];

/** @param {string} pathname */
export function isHomeSubjectArea(pathname) {
  return HOME_SUBJECT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Ôn tập / thực hành / tài liệu — xem nội dung không ép đăng nhập như tương tác feed. */
export function isSubjectContentPath(pathname) {
  return SUBJECT_CONTENT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Khách truy cập /home/... (ôn tập, thực hành, tài liệu) → chuyển sang /community/... tương ứng.
 * @param {string} pathname
 * @returns {string | null}
 */
export function mapHomeSubjectPathToCommunity(pathname) {
  if (!isHomeSubjectArea(pathname)) return null;
  return pathname.replace(/^\/home/, "/community");
}

/**
 * Đã đăng nhập trên landing hoặc /community → chuyển sang /home tương ứng.
 * @param {string} pathname
 * @returns {string | null}
 */
export function mapCommunityPathToHome(pathname) {
  if (pathname === "/community") {
    return "/home";
  }

  if (pathname.startsWith("/community/")) {
    return pathname.replace(/^\/community/, "/home");
  }

  return null;
}

/**
 * @param {"community" | "home"} [scope="community"]
 */
export function getSubjectNavLinks(scope = "community") {
  const base = scope === "home" ? "/home" : "/community";

  return [
    { to: `${base}/final-exam`, label: "Câu hỏi ôn tập", key: "review" },
    { to: `${base}/practical-exam`, label: "Câu hỏi thực hành", key: "practice" },
    { to: `${base}/documents`, label: "Tài liệu", key: "documents" },
  ];
}
