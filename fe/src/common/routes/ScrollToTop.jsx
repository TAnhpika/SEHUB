import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function scrollContainersToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  document.querySelectorAll("[data-layout-scroll]").forEach((el) => {
    el.scrollTo({ top: 0, left: 0, behavior: "auto" });
  });
}

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    scrollContainersToTop();
  }, [pathname]);

  return null;
}
