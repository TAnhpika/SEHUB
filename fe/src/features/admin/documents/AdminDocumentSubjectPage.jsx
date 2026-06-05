import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudArrowUp } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import StatusBadge from "@/features/admin/shared/StatusBadge";
import { getSemesterLabel } from "@/features/admin/exams/adminExamData";
import {
  addAdminDocument,
  getAdminDocumentsBySubject,
  removeAdminDocument,
} from "@/features/admin/documents/adminDocumentData";
import { getAdminDocumentsCatalogUrl } from "@/features/admin/documents/adminDocumentPaths";
import DocumentAccessPreview from "@/features/admin/documents/DocumentAccessPreview";
import docStyles from "@/features/admin/documents/AdminDocuments.module.css";
import AdminTableFooter from "@/features/admin/shared/AdminTableFooter";
import { ADMIN_PAGE_SIZES } from "@/features/admin/shared/adminPaginationConstants";
import { useAdminPagination } from "@/features/admin/shared/useAdminPagination";
import styles from "@/features/admin/shared/adminPage.module.css";

const DEMO_SUBJECTS = new Set(["PRF192"]);

function AdminDocumentSubjectPage() {
  const { courseCode } = useParams();
  const [searchParams] = useSearchParams();
  const semester = searchParams.get("semester") ?? "all";
  const code = courseCode?.toUpperCase() ?? "";
  const { showToast } = useToast();
  const [showUpload, setShowUpload] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const documents = useMemo(
    () => getAdminDocumentsBySubject(code, semester),
    [code, semester, refreshKey],
  );

  const docPage = useAdminPagination(documents, ADMIN_PAGE_SIZES.documents, [
    code,
    semester,
    refreshKey,
  ]);

  const catalogBack = getAdminDocumentsCatalogUrl({
    semester: semester !== "all" ? semester : undefined,
  });

  function handleUpload(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("file");
    const accessSelect = form.elements.namedItem("access");
    const file = fileInput instanceof HTMLInputElement ? fileInput.files?.[0] : null;
    const access =
      accessSelect instanceof HTMLSelectElement ? accessSelect.value : "premium";

    if (!file) return;

    addAdminDocument({
      name: file.name,
      subject: code,
      semester: semester !== "all" ? semester : "1",
      access: access === "free" ? "Free (3 trang)" : "Premium",
      pages: 0,
    });
    setRefreshKey((k) => k + 1);
    showToast("Đã upload tài liệu (mock).");
    setShowUpload(false);
    form.reset();
  }

  function handleDelete(id) {
    if (removeAdminDocument(id)) {
      setRefreshKey((k) => k + 1);
      showToast("Đã xóa tài liệu (mock).");
    }
  }

  const semesterLabel =
    semester && semester !== "all" ? getSemesterLabel(semester) : "Tất cả kỳ";

  return (
    <AdminPageLayout
      title={`Tài liệu — ${code}`}
      subtitle="Upload PDF/DOCX/PPTX, phân quyền Free (3 trang) hoặc Premium (full + tải)."
      breadcrumbs={[
        { label: "Dashboard", to: "/admin" },
        { label: "Quản lý tài liệu", to: catalogBack },
        { label: code },
      ]}
      actions={
        <Button onClick={() => setShowUpload((v) => !v)}>
          {showUpload ? "Đóng form upload" : "Upload tài liệu"}
        </Button>
      }
    >
      <div className={docStyles.subjectHero}>
        <div className={docStyles.subjectHeroMain}>
          <h2 className={docStyles.subjectCode}>{code}</h2>
          <div className={docStyles.subjectHeroMeta}>
            {semester !== "all" ? (
              <span className={docStyles.semesterPill}>{semesterLabel}</span>
            ) : null}
            <span className={docStyles.statChip}>
              {documents.length} tài liệu
            </span>
            {documents.some((d) => d.source === "exam") ? (
              <span className={`${docStyles.statChip} ${docStyles.statChipHighlight}`}>
                Có file từ đề đã duyệt
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {DEMO_SUBJECTS.has(code) && documents.length > 0 ? (
        <div className={docStyles.demoBanner}>
          <strong>Môn demo phân quyền</strong>
          <span>
            Đăng nhập SV: <code>student_basic</code> / <code>basic123</code> (Basic) hoặc{" "}
            <code>student_premium</code> / <code>premium123</code> (Premium) → Tài liệu → PRF192.
          </span>
        </div>
      ) : null}

      {documents.length > 0 ? <DocumentAccessPreview documents={documents} /> : null}

      {showUpload ? (
        <form className={`${styles.panel} ${styles.formGrid}`} onSubmit={handleUpload}>
          <h2 className={styles.panelTitle}>Upload tài liệu mới</h2>
          <div className={styles.divider} />
          <div className={styles.formRow2}>
            <label className={styles.field}>
              <span className={styles.label}>Môn học</span>
              <input className={styles.input} value={code} readOnly />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Quyền truy cập</span>
              <select className={styles.select} name="access" defaultValue="premium">
                <option value="free">Free (3 trang)</option>
                <option value="premium">Premium (full)</option>
              </select>
            </label>
          </div>
          <label className={`${styles.field} ${docStyles.uploadField}`}>
            <span className={styles.label}>File</span>
            <div className={styles.uploadZone}>
              <FontAwesomeIcon icon={faCloudArrowUp} className={styles.uploadIcon} />
              <span className={styles.uploadText}>PDF, DOCX, PPTX</span>
              <input name="file" type="file" accept=".pdf,.docx,.pptx" required />
            </div>
          </label>
          <div className={docStyles.formSubmit}>
            <Button type="submit">Tải lên</Button>
          </div>
        </form>
      ) : null}

      <section className={styles.panel}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tên file</th>
                <th>Kỳ</th>
                <th>Quyền</th>
                <th>Số trang</th>
                <th>Nguồn</th>
                <th>Ngày upload</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {documents.length > 0 ? (
                docPage.pageItems.map((doc) => (
                  <tr key={doc.id}>
                    <td className={styles.cellMain}>
                      {doc.name}
                      {doc.examTitle ? (
                        <span className={docStyles.sourceTag} title={doc.examTitle}>
                          Đề đã duyệt
                        </span>
                      ) : null}
                    </td>
                    <td>{getSemesterLabel(doc.semester)}</td>
                    <td>
                      <StatusBadge
                        status={doc.access.includes("Premium") ? "published" : "draft"}
                        label={doc.access}
                      />
                    </td>
                    <td>{doc.pages > 0 ? doc.pages : "—"}</td>
                    <td>{doc.source === "exam" ? "Duyệt đề Mod" : "Upload Admin"}</td>
                    <td>{doc.uploadedAt}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.link}
                        style={{ background: "none", border: "none", cursor: "pointer" }}
                        onClick={() => handleDelete(doc.id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ color: "#434655", padding: "1.5rem" }}>
                    Chưa có tài liệu cho môn này. Upload file hoặc duyệt đề từ Mod có đính kèm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <AdminTableFooter
          rangeStart={docPage.rangeStart}
          rangeEnd={docPage.rangeEnd}
          total={docPage.total}
          unit="tài liệu"
          currentPage={docPage.safePage}
          totalPages={docPage.totalPages}
          onPageChange={docPage.handlePageChange}
          ariaLabel="Phân trang tài liệu môn học"
        />
      </section>
    </AdminPageLayout>
  );
}

export default AdminDocumentSubjectPage;
