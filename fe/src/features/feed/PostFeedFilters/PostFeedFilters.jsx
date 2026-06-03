import FilterDropdown from "@/common/FilterDropdown/FilterDropdown";
import {
  POST_MAJOR_OPTIONS,
  POST_SEMESTER_OPTIONS,
} from "@/features/feed/feedFilterData";
import styles from "./PostFeedFilters.module.css";

function PostFeedFilters({ semester, major, onSemesterChange, onMajorChange }) {
  return (
    <div className={styles.filters}>
      <FilterDropdown
        options={POST_SEMESTER_OPTIONS}
        value={semester}
        onChange={onSemesterChange}
        ariaLabel="Lọc theo học kỳ"
      />
      <FilterDropdown
        options={POST_MAJOR_OPTIONS}
        value={major}
        onChange={onMajorChange}
        ariaLabel="Lọc theo chuyên ngành"
      />
    </div>
  );
}

export default PostFeedFilters;
