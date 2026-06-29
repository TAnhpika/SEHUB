import Shimmer from "@/common/Skeleton/Shimmer";
import docStyles from "@/features/admin/documents/AdminDocuments.module.css";

const SEMESTER_BLOCKS = [1, 2];
const CARD_PLACEHOLDERS = [1, 2, 3, 4, 5, 6];

function AdminDocumentCatalogSkeleton() {
  return (
    <div className={docStyles.catalogWrap} aria-busy="true" aria-label="Đang tải danh mục tài liệu">
      <div className={docStyles.skeletonFilterBar}>
        <Shimmer className={docStyles.skeletonFilter} />
        <Shimmer className={docStyles.skeletonFilter} />
      </div>

      <div className={docStyles.skeletonContent}>
        {SEMESTER_BLOCKS.map((block) => (
          <section key={block} className={docStyles.skeletonSection}>
            <Shimmer className={docStyles.skeletonSemesterTitle} />
            <div className={docStyles.skeletonGrid}>
              {CARD_PLACEHOLDERS.map((card) => (
                <Shimmer key={`${block}-${card}`} className={docStyles.skeletonCard} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default AdminDocumentCatalogSkeleton;
