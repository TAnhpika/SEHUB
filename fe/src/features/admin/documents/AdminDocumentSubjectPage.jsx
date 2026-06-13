import { useEffect, useMemo, useState } from "react";
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
  deleteAdminDocumentViaApi,
  getAdminDocumentsBySubject,
  loadAdminDocuments,
  updateAdminDocumentViaApi,
  uploadAdminDocumentViaApi,
} from "@/features/admin/documents/adminDocumentData";
import DocumentEditModal from "@/features/admin/documents/DocumentEditModal";
import { getAdminDocumentsCatalogUrl } from "@/features/admin/documents/adminDocumentPaths";
import DocumentAccessPreview, {
  DocumentAccessCompare,
} from "@/features/admin/documents/DocumentAccessPreview";
import docStyles from "@/features/admin/documents/AdminDocuments.module.css";
import AdminTableFooter from "@/features/admin/shared/AdminTableFooter";
import { ADMIN_PAGE_SIZES } from "@/features/admin/shared/adminPaginationConstants";
import { useAdminPagination } from "@/features/admin/shared/useAdminPagination";
import styles from "@/features/admin/shared/adminPage.module.css";

const DEFAULT_UPLOAD_PAGES = 12;

function AdminDocumentSubjectPage() {
  const { courseCode } = useParams();
  const [searchParams] = useSearchParams();
  const semester = searchParams.get("semester") ?? "all";
  const code = courseCode?.toUpperCase() ?? "";
  const { showToast } = useToast();
  const [showUpload, setShowUpload] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [uploadAccess, setUploadAccess] = useState("free");
  const [uploadPages, setUploadPages] = useState(String(DEFAULT_UPLOAD_PAGES));
  const [uploadFileName, setUploadFileName] = useState("");
  const [editingDoc, setEditingDoc] = useState(null);

  useEffect(() => {
    loadAdminDocuments();
  }, [refreshKey]);

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
    const pagesInput = form.elements.namedItem("pages");
    const file = fileInput instanceof HTMLInputElement ? fileInput.files?.[0] : null;
    const access =
      accessSelect instanceof HTMLSelectElement ? accessSelect.value : "premium";
    const pagesRaw =
      pagesInput instanceof HTMLInputElement ? Number(pagesInput.value) : DEFAULT_UPLOAD_PAGES;
    const pages = Number.isFinite(pagesRaw) && pagesRaw > 0 ? pagesRaw : DEFAULT_UPLOAD_PAGES;

    if (!file) return;

    uploadAdminDocumentViaApi({
      file,
      subject: code,
      semester: semester !== "all" ? semester : "1",
      access: access === "free" ? "Free (3 trang)" : "Premium",
      pages,
    })
      .then((result) => {
        if (!result.ok) {
          showToast(result.message ?? "Upload thất bại.");
          return;
        }
        setRefreshKey((k) => k + 1);
        showToast("Đã upload tài liệu.");
        setShowUpload(false);
        setUploadAccess("free");
        setUploadPages(String(DEFAULT_UPLOAD_PAGES));
        setUploadFileName("");
        form.reset();
      })
      .catch((err) => {
        showToast(err.message ?? "Upload thất bại.");
      });
  }

  const uploadPreviewDoc = useMemo(
    () => ({
      name: uploadFileName || "Tài liệu đang upload",
      access: uploadAccess === "free" ? "Free (3 trang)" : "Premium",
      pages: Math.max(1, Number(uploadPages) || DEFAULT_UPLOAD_PAGES),
    }),
    [uploadAccess, uploadPages, uploadFileName],
  );

  function handleDelete(id) {
    deleteAdminDocumentViaApi(id)
      .then((result) => {
        if (!result.ok) {
          showToast(result.message ?? "Không xóa được tài liệu.");
          return;
        }
        if (editingDoc?.id === id) setEditingDoc(null);
        setRefreshKey((k) => k + 1);
        showToast("Đã xóa tài liệu.");
      })
      .catch((err) => {
        showToast(err.message ?? "Không xóa được tài liệu.");
      });
  }

  function handleEditSave(payload) {
    if (!editingDoc) return;
    updateAdminDocumentViaApi(editingDoc.id, payload)
      .then((result) => {
        if (!result.ok) {
          showToast(result.message ?? "Không thể cập nhật tài liệu.");
          return;
        }
        setRefreshKey((k) => k + 1);
        setEditingDoc(null);
        showToast("Đã cập nhật tài liệu.");
      })
      .catch((err) => {
        showToast(err.message ?? "Không thể cập nhật tài liệu.");
      });
  }

  const semesterLabel =
    semester && semester !== "all" ? getSemesterLabel(semester) : "Tất cả kỳ";

  return (
    <AdminPageLayout
      title={`Tài liệu — ${code}`}
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
              <select
                className={styles.select}
                name="access"
                value={uploadAccess}
                onChange={(event) => setUploadAccess(event.target.value)}
              >
                <option value="free">Free (3 trang) — Basic xem tối đa 3 trang, không tải</option>
                <option value="premium">Premium — chỉ Premium xem & tải full</option>
              </select>
            </label>
          </div>
          <div className={styles.formRow2}>
            <label className={styles.field}>
              <span className={styles.label}>Số trang (ước lượng)</span>
              <input
                className={styles.input}
                name="pages"
                type="number"
                min={1}
                max={999}
                required
                value={uploadPages}
                onChange={(event) => setUploadPages(event.target.value)}
              />
            </label>
            <div className={styles.field}>
              <span className={styles.label}>Quy tắc nhanh</span>
              <p className={docStyles.uploadAccessHint}>
                {uploadAccess === "free"
                  ? "SV Basic: xem tối đa 3 trang đầu, không tải. SV Premium: xem & tải toàn bộ."
                  : "SV Basic: khóa hoàn toàn, gợi ý nâng cấp. SV Premium: xem & tải toàn bộ."}
              </p>
            </div>
          </div>
          <label className={`${styles.field} ${docStyles.uploadField}`}>
            <span className={styles.label}>File</span>
            <div className={styles.uploadZone}>
              <FontAwesomeIcon icon={faCloudArrowUp} className={styles.uploadIcon} />
              <span className={styles.uploadText}>PDF, DOCX, PPTX</span>
              <input
                name="file"
                type="file"
                accept=".pdf,.docx,.pptx"
                required
                onChange={(event) =>
                  setUploadFileName(event.target.files?.[0]?.name ?? "")
                }
              />
            </div>
          </label>
          <section className={docStyles.uploadPreviewPanel}>
            <h3 className={docStyles.previewTitle}>Xem trước khi upload</h3>
            <p className={docStyles.previewSubtitle}>
              Thay đổi quyền hoặc số trang để xem SV Basic / Premium sẽ thấy gì.
            </p>
            <p
              className={`${docStyles.uploadPreviewMode} ${
                uploadAccess === "free"
                  ? docStyles.uploadPreviewModeFree
                  : docStyles.uploadPreviewModePremium
              }`}
            >
              {uploadAccess === "free" ? (
                <>
                  <strong>Free (3 trang):</strong> SV Basic xem tối đa 3 trang đầu, không tải. SV
                  Premium xem & tải full.
                </>
              ) : (
                <>
                  <strong>Premium only:</strong> SV Basic bị khóa hoàn toàn. Chọn &quot;Free (3
                  trang)&quot; nếu muốn Basic được xem thử 3 trang.
                </>
              )}
            </p>
            <DocumentAccessCompare doc={uploadPreviewDoc} showMeta={false} />
          </section>
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
                      <div className={docStyles.tableActions}>
                        <button
                          type="button"
                          className={docStyles.tableActionBtn}
                          onClick={() => setEditingDoc(doc)}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className={`${docStyles.tableActionBtn} ${docStyles.tableActionDanger}`}
                          onClick={() => handleDelete(doc.id)}
                        >
                          Xóa
                        </button>
                      </div>
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

      <DocumentEditModal
        open={Boolean(editingDoc)}
        document={editingDoc}
        onClose={() => setEditingDoc(null)}
        onSubmit={handleEditSave}
      />
    </AdminPageLayout>
  );
}

export default AdminDocumentSubjectPage;
