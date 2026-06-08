import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import styles from "./ExamFocusLayout.module.css";

function ExamFocusLayout() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("exam-focus-mode");

    document.documentElement.requestFullscreen?.().catch(() => {});

    return () => {
      root.classList.remove("exam-focus-mode");
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    };
  }, []);

  return (
    <div className={styles.shell}>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

export default ExamFocusLayout;
