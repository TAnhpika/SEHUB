import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function scrollContainersToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  document.querySelectorAll("[data-layout-scroll]").forEach((el) => {
    el.scrollTo({ top: 0, left: 0, behavior: "instant" });
  });
}

export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    scrollContainersToTop();
  }, [pathname, search]);

  return null;
}
