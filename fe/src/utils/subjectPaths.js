const SEGMENTS = {
  review: "final-exam",
  practice: "pratical-exam",
  documents: "documents",
};

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

/**
 * @param {"community" | "home"} [scope="community"]
 */
export function getSubjectNavLinks(scope = "community") {
  const base = scope === "home" ? "/home" : "/community";

  return [
    { to: `${base}/final-exam`, label: "Câu hỏi ôn tập", key: "review" },
    { to: `${base}/pratical-exam`, label: "Câu hỏi thực hành", key: "practice" },
    { to: `${base}/documents`, label: "Tài liệu", key: "documents" },
  ];
}
