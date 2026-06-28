import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { Modal } from "@/common/Modal/Modal";
import backdropStyles from "@/common/styles/modalBackdrop.module.css";
import { EXAM_SEMESTERS } from "@/features/admin/exams/adminExamData";
import {
  formatDocumentAccessLabel,
  parseDocumentAccessKey,
} from "@/features/admin/documents/adminDocumentData";
import { DocumentAccessCompare } from "@/features/admin/documents/DocumentAccessPreview";
import docStyles from "@/features/admin/documents/AdminDocuments.module.css";
import styles from "@/features/admin/shared/adminPage.module.css";

/**
 * @param {{
 *   open: boolean;
 *   document: object | null;
 *   onClose: () => void;
 *   onSubmit: (payload: { accessKey: string, pages: number, semester: string, description: string }) => void;
 * }} props
 */
function DocumentEditModal({ open, document, onClose, onSubmit }) {
  const [accessKey, setAccessKey] = useState("free");
  const [pages, setPages] = useState("12");
  const [semester, setSemester] = useState("1");
  const [description, setDescription] = useState("");

  const isExamSource = document?.source === "exam";

  useEffect(() => {
    if (!open || !document) return;
    setAccessKey(parseDocumentAccessKey(document.access));
    setPages(String(document.pages > 0 ? document.pages : 12));
    setSemester(document.semester ?? "1");
    setDescription(document.description ?? "");
  }, [open, document]);

  const previewDoc = useMemo(
    () => ({
      name: document?.name ?? "Tài liệu",
      access: formatDocumentAccessLabel(accessKey),
      pages: Math.max(1, Number(pages) || 1),
      description: description.trim() || undefined,
    }),
    [document?.name, accessKey, pages, description],
  );

  if (!open || !document) return null;

  function handleSubmit(event) {
    event.preventDefault();
    const pagesNum = Math.max(1, Number(pages) || 1);
    onSubmit({
      accessKey,
      pages: pagesNum,
      semester,
      description,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      className={backdropStyles.overlay}
      panelClassName={`${docStyles.modal} ${docStyles.editModal}`}
      closeOnOverlay
    >
        <header className={docStyles.modalHead}>
          <div>
            <h2 id="document-edit-title" className={docStyles.modalTitle}>
              Sửa tài liệu
            </h2>
            <p className={docStyles.modalDesc}>{document.name}</p>
          </div>
          <button
            type="button"
            className={docStyles.modalClose}
            aria-label="Đóng"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>

        {isExamSource ? (
          <p className={docStyles.editSourceNote}>
            Tài liệu từ đề Mod — chỉ sửa quyền, số trang và mô tả. Kỳ học giữ nguyên theo đề đã
            duyệt.
          </p>
        ) : null}

        <form className={docStyles.editForm} onSubmit={handleSubmit}>
          <div className={styles.formRow2}>
            <label className={styles.field}>
              <span className={styles.label}>Quyền truy cập</span>
              <select
                className={styles.select}
                value={accessKey}
                onChange={(event) => setAccessKey(event.target.value)}
              >
                <option value="free">Free (3 trang) — Basic xem tối đa 3 trang, không tải</option>
                <option value="premium">Premium — chỉ Premium xem & tải full</option>
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Số trang (ước lượng)</span>
              <input
                className={styles.input}
                type="number"
                min={1}
                max={999}
                required
                value={pages}
                onChange={(event) => setPages(event.target.value)}
              />
            </label>
          </div>

          <div className={styles.formRow2}>
            <label className={styles.field}>
              <span className={styles.label}>Kỳ học</span>
              <select
                className={styles.select}
                value={semester}
                disabled={isExamSource}
                onChange={(event) => setSemester(event.target.value)}
              >
                {EXAM_SEMESTERS.filter((option) => option.id !== "all").map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Mô tả (tuỳ chọn)</span>
              <input
                className={styles.input}
                value={description}
                placeholder="Ghi chú cho admin / SV"
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
          </div>

          <section className={docStyles.uploadPreviewPanel}>
            <h3 className={docStyles.previewTitle}>Xem trước phân quyền</h3>
            <p
              className={`${docStyles.uploadPreviewMode} ${
                accessKey === "free"
                  ? docStyles.uploadPreviewModeFree
                  : docStyles.uploadPreviewModePremium
              }`}
            >
              {accessKey === "free" ? (
                <>
                  <strong>Free (3 trang):</strong> SV Basic xem tối đa 3 trang đầu. SV Premium
                  xem & tải full.
                </>
              ) : (
                <>
                  <strong>Premium only:</strong> SV Basic bị khóa. Chọn Free nếu muốn Basic xem
                  thử 3 trang.
                </>
              )}
            </p>
            <DocumentAccessCompare doc={previewDoc} showMeta={false} />
          </section>

          <footer className={docStyles.modalActions}>
            <Button type="button" look="outline" onClick={onClose}>
              Huỷ
            </Button>
            <Button type="submit">Lưu thay đổi</Button>
          </footer>
        </form>
    </Modal>
  );
}

export default DocumentEditModal;
