import styles from "./LearningActivitySection.module.css";

/**
 * @param {{ activeTab: "exams" | "practice"; examCount: number; practiceCount: number; onChange: (tab: "exams" | "practice") => void }} props
 */
function LearningActivityTabs({ activeTab, examCount, practiceCount, onChange }) {
  return (
    <div className={styles.tabs} role="tablist" aria-label="Loại hoạt động học tập">
      <button
        type="button"
        role="tab"
        id="learning-tab-exams"
        aria-selected={activeTab === "exams"}
        aria-controls="learning-panel-exams"
        className={`${styles.tab} ${activeTab === "exams" ? styles.tabActive : ""}`}
        onClick={() => onChange("exams")}
      >
        Đề cuối kỳ ({examCount})
      </button>
      <button
        type="button"
        role="tab"
        id="learning-tab-practice"
        aria-selected={activeTab === "practice"}
        aria-controls="learning-panel-practice"
        className={`${styles.tab} ${activeTab === "practice" ? styles.tabActive : ""}`}
        onClick={() => onChange("practice")}
      >
        Thực hành ({practiceCount})
      </button>
    </div>
  );
}

export default LearningActivityTabs;
