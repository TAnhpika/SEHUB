import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboardList, faLaptopCode } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import { EXAM_TYPE_OPTIONS } from "@/features/admin/exams/adminExamData";
import { ADMIN_EXAM_FLOW } from "@/features/exams/examFormFlow";
import formStyles from "@/features/admin/exams/AdminExamFormPage.module.css";
import styles from "@/features/admin/exams/AdminExamNewPage.module.css";

const TYPE_ICONS = {
  final: faClipboardList,
  practice: faLaptopCode,
};

const TYPE_PATHS = {
  final: ADMIN_EXAM_FLOW.finalExamPath,
  practice: ADMIN_EXAM_FLOW.practiceExamPath,
};

function AdminExamNewPage() {
  return (
    <AdminPageLayout
      title="Thêm đề mới"
      subtitle="Chọn loại đề để tạo bằng wizard giống Moderator. Admin xuất bản trực tiếp sau khi hoàn tất."
      breadcrumbs={[
        { label: "Dashboard", to: "/admin" },
        { label: "Quản lý đề thi", to: "/admin/exams" },
        { label: "Thêm mới" },
      ]}
      actions={
        <Button look="outline" to="/admin/exams">
          Hủy
        </Button>
      }
    >
      <section className={formStyles.typeSection}>
        <p className={formStyles.typeSectionTitle}>Loại đề thi</p>
        <div className={formStyles.typeGrid}>
          {EXAM_TYPE_OPTIONS.map((opt) => (
            <Link
              key={opt.key}
              to={TYPE_PATHS[opt.key]}
              className={`${formStyles.typeCard} ${styles.typeCardLink}`}
            >
              <span className={styles.typeIcon} aria-hidden>
                <FontAwesomeIcon icon={TYPE_ICONS[opt.key]} />
              </span>
              <span className={formStyles.typeCardLabel}>{opt.label}</span>
              <span className={formStyles.typeCardDesc}>{opt.description}</span>
              <span className={styles.typeCta}>Tiếp tục →</span>
            </Link>
          ))}
        </div>
      </section>
    </AdminPageLayout>
  );
}

export default AdminExamNewPage;
