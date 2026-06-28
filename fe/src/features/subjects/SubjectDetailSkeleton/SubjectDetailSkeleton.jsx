import Shimmer from "@/common/Skeleton/Shimmer";
import styles from "./SubjectDetailSkeleton.module.css";

const EXAM_HEADERS = ["Mã đề", "Loại đề", "Số câu hỏi"];
const DOCUMENT_HEADERS = ["Tên file", "Định dạng"];

function TableRowSkeleton({ isDocuments }) {
  return (
    <tr>
      <td>
        <div className={styles["cell-primary"]}>
          <Shimmer className={styles["cell-code"]} />
          <Shimmer className={styles["cell-time"]} />
        </div>
      </td>
      <td>
        <Shimmer className={styles["cell-center"]} />
      </td>
      {!isDocuments ? (
        <td>
          <Shimmer className={styles["cell-right"]} />
        </td>
      ) : null}
    </tr>
  );
}

function SubjectDetailSkeleton({ isDocuments = false }) {
  const headers = isDocuments ? DOCUMENT_HEADERS : EXAM_HEADERS;

  return (
    <div className={styles.page} aria-busy="true" aria-label="Đang tải danh sách đề">
      <Shimmer className={styles.back} />

      <header className={styles.header}>
        <Shimmer className={styles["header-icon"]} />
        <div className={styles["header-text"]}>
          <Shimmer className={styles.title} />
          <Shimmer className={styles.subtitle} />
        </div>
      </header>

      <div className={styles["filter-bar"]}>
        <Shimmer className={styles.filter} />
        <Shimmer className={`${styles.filter} ${styles.filterWide}`} />
      </div>

      <section className={styles["table-wrap"]}>
        <table className={styles.table}>
          <thead>
            <tr>
              {headers.map((label) => (
                <th key={label} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }, (_, index) => (
              <TableRowSkeleton key={index} isDocuments={isDocuments} />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default SubjectDetailSkeleton;
