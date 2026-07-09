import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpFromBracket,
  faCloudArrowUp,
  faFileArchive,
  faFilePdf,
  faGear,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import RichTextEditor from "@/common/RichTextEditor/RichTextEditor";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { saveAdminPracticeExamFromPayload } from "@/features/admin/exams/adminExamData";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import { useExamFormFlow } from "@/features/exams/examFormFlow";
import ModeratorPageShell from "@/features/moderator/components/ModeratorPageShell/ModeratorPageShell";
import { ModeratorFormSkeleton } from "@/features/moderator/components/ModeratorSkeleton/ModeratorSkeleton";
import ExamContributionAuditList from "@/features/moderator/exams/components/ExamContributionAuditList/ExamContributionAuditList";
import {
  ApiError,
  loadExamContributionAudit,
  loadPendingContributionCount,
  recordExamDraft,
  submitExamForApproval,
} from "@/features/moderator/exams/moderatorExamContributionStore";
import {
  loadPracticeExamForEdit,
  resubmitPracticeExamViaApi,
} from "@/features/moderator/exams/moderatorExamService";
import {
  DEMO_DRAFT,
  getSubjectOptionsForSemester,
  PRACTICE_SEMESTER_OPTIONS,
} from "@/features/moderator/practiceExams/practiceExamData";
import {
  generateExamPaperCode,
  loadExistingExamPaperIdentifiers,
} from "@/utils/examPaperCode";
import {
  createPracticeAttachmentEntry,
  PRACTICE_UPLOAD_ACCEPT,
  validatePracticeUploadFile,
} from "@/features/moderator/practiceExams/practiceExamUpload";
import { loadReviewCourses, REVIEW_COURSES } from "@/features/review/ReviewQuestionsPage/reviewData";
import styles from "./AddPracticeExamPage.module.css";

/**
 * @fileoverview Trang tạo / sửa đề thực hành cho Moderator và Admin.
 *
 * Moderator upload file đề (PDF/ZIP/RAR/DOCX), mô tả yêu cầu, ghim đề,
 * lưu nháp hoặc gửi Admin duyệt. Hỗ trợ tab nhật ký đóng góp, chỉnh sửa đề bị từ chối,
 * và gửi bản revision của đề đã public.
 *
 * @module features/moderator/practiceExams/AddPracticeExamPage
 */

/**
 * Breadcrumb khi Moderator thêm đề thực hành mới.
 *
 * @constant {ReadonlyArray<{ label: string, to?: string }>}
 * @readonly
 */
const MOD_PRACTICE_CRUMBS = [
  { label: "Trang chủ", to: "/home" },
  { label: "Đóng góp" },
  { label: "Thêm đề thực hành" },
];

/**
 * Breadcrumb khi Moderator sửa đề thực hành đã gửi.
 *
 * @constant {ReadonlyArray<{ label: string, to?: string }>}
 * @readonly
 */
const EDIT_PRACTICE_CRUMBS = [
  { label: "Trang chủ", to: "/home" },
  { label: "Đóng góp" },
  { label: "Lịch sử đóng góp đề", to: "/moderator/exams/history?type=practice" },
  { label: "Sửa đề thực hành" },
];

/** @constant {string} Chuỗi `accept` cho input file đính kèm. */
const ACCEPTED_TYPES = PRACTICE_UPLOAD_ACCEPT;

/** @constant {number} Giới hạn dung lượng file hiển thị trên UI (MB). */
const MAX_FILE_MB = 50;

/**
 * @typedef {Object} FileTypeIconProps
 * @property {'pdf' | 'zip'} type - Loại icon hiển thị theo extension file.
 */

/**
 * Icon loại file đính kèm (PDF hoặc archive).
 *
 * @param {FileTypeIconProps} props - Props của component.
 * @returns {import('react').ReactElement} FontAwesome icon.
 */
function FileTypeIcon({ type }) {
  if (type === "pdf") {
    return <FontAwesomeIcon icon={faFilePdf} className={styles["file-icon-pdf"]} />;
  }
  return <FontAwesomeIcon icon={faFileArchive} className={styles["file-icon-zip"]} />;
}

/**
 * Trang thêm / sửa đề thực hành — form upload, lưu nháp, gửi duyệt hoặc xuất bản Admin.
 *
 * @returns {import('react').ReactElement} Form đề thực hành bọc trong page shell phù hợp scope.
 */
function AddPracticeExamPage() {
  const navigate = useNavigate();
  const { examId: routeExamId } = useParams();
  const flow = useExamFormFlow();
  const isAdminFlow = flow.scope === "admin";
  const isEditMode = Boolean(routeExamId) && !isAdminFlow;
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const moderator = user?.username ?? "mod_sehub";

  const [editingExamId, setEditingExamId] = useState(routeExamId ?? null);
  const [revisionOfExamId, setRevisionOfExamId] = useState(null);
  const [revisionSourceCode, setRevisionSourceCode] = useState(null);
  const [revisionSourceTitle, setRevisionSourceTitle] = useState(null);
  const isRevisionEdit = Boolean(revisionOfExamId);
  const [loadingExam, setLoadingExam] = useState(isEditMode);
  const [loadExamError, setLoadExamError] = useState(null);

  const [activeTab, setActiveTab] = useState("create");
  const [refreshKey, setRefreshKey] = useState(0);
  const [auditLog, setAuditLog] = useState([]);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
  const [subject, setSubject] = useState(DEMO_DRAFT.subject);
  const [semester, setSemester] = useState(DEMO_DRAFT.semester);
  const [title, setTitle] = useState(DEMO_DRAFT.title);
  const [description, setDescription] = useState(DEMO_DRAFT.description);
  const [attachments, setAttachments] = useState([]);
  const [pinExam, setPinExam] = useState(DEMO_DRAFT.pinExam);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [existingPaperCodes, setExistingPaperCodes] = useState([]);
  const [reviewCourses, setReviewCourses] = useState(REVIEW_COURSES);

  const subjectOptions = useMemo(
    () => getSubjectOptionsForSemester(semester, reviewCourses),
    [semester, reviewCourses],
  );

  useEffect(() => {
    let cancelled = false;
    loadReviewCourses()
      .then((courses) => {
        if (!cancelled) setReviewCourses(courses);
      })
      .catch(() => {
        // Giữ catalog tĩnh khi API/DB không phản hồi — tránh dropdown trống.
        if (!cancelled) setReviewCourses(REVIEW_COURSES);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadExistingExamPaperIdentifiers()
      .then((codes) => {
        if (!cancelled) setExistingPaperCodes(codes);
      })
      .catch(() => {
        if (!cancelled) setExistingPaperCodes([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isEditMode || !routeExamId) return undefined;

    let cancelled = false;
    setLoadingExam(true);
    setLoadExamError(null);

    loadPracticeExamForEdit(routeExamId)
      .then((loaded) => {
        if (cancelled) return;
        setEditingExamId(loaded.examId);
        setRevisionOfExamId(loaded.revisionOfExamId);
        setRevisionSourceCode(loaded.revisionSourceCode);
        setRevisionSourceTitle(loaded.revisionSourceTitle);
        setSubject(loaded.subjectCode);
        setSemester(loaded.semester);
        setTitle(loaded.title);
        setDescription(loaded.description);
        setAttachments(loaded.attachments ?? []);
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadExamError(error?.message ?? "Không tải được đề để chỉnh sửa.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingExam(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isEditMode, routeExamId]);

  useEffect(() => {
    if (isEditMode) return;
    if (!subject.trim()) {
      setTitle("");
      return;
    }
    const nextTitle = generateExamPaperCode("practice", subject, existingPaperCodes);
    setTitle((prev) => (prev === nextTitle ? prev : nextTitle));
  }, [subject, existingPaperCodes, isEditMode]);

  useEffect(() => {
    if (isAdminFlow) return undefined;

    let cancelled = false;

    Promise.all([
      loadExamContributionAudit(moderator, { examType: "practice" }),
      loadPendingContributionCount(moderator, "practice"),
    ])
      .then(([items, pendingCount]) => {
        if (cancelled) return;
        setAuditLog(items);
        setPendingApprovalCount(pendingCount);
      })
      .catch(() => {
        if (!cancelled) {
          setAuditLog([]);
          setPendingApprovalCount(0);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [moderator, refreshKey, isAdminFlow]);

  function buildPayload() {
    return {
      examType: "practice",
      moderator,
      subjectCode: subject,
      semester,
      title,
      description,
      attachments,
      pinExam,
      revisionSourceCode,
      revisionSourceTitle,
    };
  }

  function hasReadyAttachments() {
    return attachments.some(
      (file) => file.status === "done" && (file.file instanceof File || file.existing),
    );
  }

  function handleSaveDraft() {
    if (isAdminFlow) return;
    if (!subject || !semester || !title.trim()) {
      showToast("Điền môn, học kỳ và tiêu đề trước khi lưu nháp.");
      return;
    }
    recordExamDraft(buildPayload());
    setRefreshKey((k) => k + 1);
    showToast("Đã lưu nháp đề thi thực hành.");
  }

  async function handlePublish(event) {
    event?.preventDefault?.();
    if (!subject || !semester || !title.trim() || !description.trim()) {
      showToast("Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }
    if (attachments.some((file) => file.status === "uploading")) {
      showToast("Đợi file đính kèm xử lý xong trước khi gửi.");
      return;
    }
    if (!hasReadyAttachments()) {
      showToast("Chọn ít nhất một file đề (PDF/ZIP/RAR/DOCX).");
      return;
    }

    const payload = buildPayload();

    async function send(confirmDuplicate = false) {
      if (isAdminFlow) {
        await saveAdminPracticeExamFromPayload(payload, { confirmDuplicate });
        showToast("Đề thi thực hành đã được xuất bản.");
        navigate(flow.examsListPath);
        return;
      }

      if (isEditMode && editingExamId) {
        await resubmitPracticeExamViaApi(editingExamId, payload, { isRevision: isRevisionEdit });
        showToast(
          isRevisionEdit
            ? "Bản cập nhật đã gửi Admin duyệt. Đề đang public giữ nguyên."
            : "Đề đã được sửa và gửi lại Admin duyệt.",
        );
        navigate("/moderator/exams/history?type=practice");
        return;
      }

      await submitExamForApproval(payload, { confirmDuplicate });
      setRefreshKey((k) => k + 1);
      setActiveTab("audit");
      showToast("Đề thi đã gửi chờ Admin duyệt trước khi xuất bản.");
    }

    setSubmitting(true);
    try {
      await send(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const confirmed = await confirm({
          title: "Đề trùng metadata",
          description: isAdminFlow
            ? "Đề trùng metadata với đề đã có. Xuất bản anyway?"
            : "Đề trùng metadata với đề đã có. Gửi duyệt anyway?",
          confirmLabel: isAdminFlow ? "Xuất bản" : "Gửi duyệt",
        });
        if (confirmed) {
          try {
            await send(true);
            return;
          } catch (retryError) {
            showToast(retryError?.message ?? "Không gửi được đề.");
            return;
          }
        }
        return;
      }
      showToast(error?.message ?? "Không gửi được đề.");
    } finally {
      setSubmitting(false);
    }
  }

  function removeAttachment(id) {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  }

  async function addFiles(fileList) {
    if (!fileList?.length) return;

    for (const file of Array.from(fileList)) {
      const validationError = validatePracticeUploadFile(file);
      if (validationError) {
        showToast(validationError);
        continue;
      }

      const entry = createPracticeAttachmentEntry(file);
      setAttachments((prev) => [...prev, entry]);
    }
  }

  function handleFileInput(event) {
    addFiles(event.target.files);
    event.target.value = "";
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  }

  const submitLabel = submitting
    ? isAdminFlow
      ? "Đang xuất bản..."
      : "Đang gửi..."
    : isEditMode
      ? isRevisionEdit
        ? "Lưu & gửi bản cập nhật"
        : "Lưu & gửi lại Admin duyệt"
      : isAdminFlow
        ? "Xuất bản"
        : "Lưu & Xuất bản";

  const pageActions = (
    <div className={styles.actions}>
      {!isAdminFlow && !isEditMode ? (
        <button type="button" className={styles["btn-draft"]} onClick={handleSaveDraft}>
          Lưu nháp
        </button>
      ) : null}
      <Button
        type="button"
        className={styles["btn-publish"]}
        onClick={handlePublish}
        disabled={submitting || loadingExam || Boolean(loadExamError)}
      >
        <FontAwesomeIcon icon={faArrowUpFromBracket} />
        {submitting ? (isAdminFlow ? "Đang xuất bản..." : "Đang gửi...") : submitLabel}
      </Button>
    </div>
  );

  const adminCrumbs = [
    { label: "Dashboard", to: "/admin" },
    { label: "Quản lý đề thi", to: "/admin/exams" },
    { label: "Thêm mới", to: flow.examsNewPath },
    { label: "Đề thực hành" },
  ];

  const pageBody = loadingExam ? (
    <ModeratorFormSkeleton aria-label="Đang tải đề thực hành" />
  ) : loadExamError ? (
    <p className={styles.hint}>{loadExamError}</p>
  ) : (
    <section className={styles.card}>
      {!isAdminFlow && !isEditMode ? (
        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "create"}
            className={`${styles.tab} ${activeTab === "create" ? styles["tab-active"] : ""}`}
            onClick={() => setActiveTab("create")}
          >
            Tạo đề
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "audit"}
            className={`${styles.tab} ${activeTab === "audit" ? styles["tab-active"] : ""}`}
            onClick={() => setActiveTab("audit")}
          >
            Nhật ký đóng góp
            {pendingApprovalCount > 0 ? (
              <span className={styles.badge}>{pendingApprovalCount}</span>
            ) : null}
          </button>
          <Link to="/moderator/practice-submissions" className={styles["tab-link"]}>
            Chấm bài nộp GitHub →
          </Link>
        </div>
      ) : null}

      {!isAdminFlow && activeTab === "audit" ? (
        <div className={styles.auditPanel} key={refreshKey}>
          <ExamContributionAuditList
            items={auditLog}
            title="Nhật ký đóng góp đề thực hành"
            description="Mod lưu nháp hoặc gửi Admin duyệt trước khi public (§2.4). Bài nộp GitHub của sinh viên xem tại trang chấm bài riêng (§3.4)."
            emptyMessage={
              user?.role === "admin"
                ? "Đăng nhập Moderator (moderator@sehub.local) để xem demo đóng góp, hoặc bấm Lưu & Xuất bản để tạo đề mới."
                : "Chưa có bản ghi. Gửi đề mới hoặc xem Lịch sử đóng góp đề trên menu bên trái."
            }
            showHistoryLink
          />
        </div>
      ) : (
        <form className={styles.form} onSubmit={handlePublish}>
            {isRevisionEdit ? (
              <p className={styles.hint}>
                Chỉnh sửa bản cập nhật. Đề đang public giữ nguyên cho đến khi Admin duyệt.
              </p>
            ) : null}
            <div className={styles.columns}>
              <div className={styles["col-left"]}>
                <div className={styles.row}>
                  <label className={styles.field}>
                    <span className={styles.label}>
                      Học kỳ <span className={styles.required}>*</span>
                    </span>
                    <select
                      className={styles.select}
                      value={semester}
                      onChange={(event) => {
                        setSemester(event.target.value);
                        if (!isEditMode) {
                          setSubject("");
                          setTitle("");
                        }
                      }}
                      required
                      disabled={isEditMode}
                    >
                      <option value="">Chọn học kỳ</option>
                      {PRACTICE_SEMESTER_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.field}>
                    <span className={styles.label}>
                      Môn học <span className={styles.required}>*</span>
                    </span>
                    <select
                      className={styles.select}
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      disabled={!semester || isEditMode}
                      required
                    >
                      <option value="">{semester ? "Chọn môn học" : "Chọn học kỳ trước"}</option>
                      {subjectOptions.map((item) => (
                        <option key={item.code} value={item.code}>
                          {item.name ? `${item.code} — ${item.name}` : item.code}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className={styles.field}>
                  <span className={styles.label}>
                    Tiêu đề đề thi <span className={styles.required}>*</span>
                  </span>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Tự động sinh khi chọn môn học"
                    value={title}
                    readOnly
                    required
                  />
                </label>

                <div className={styles.field}>
                  <span className={styles.label}>
                    Mô tả &amp; Yêu cầu <span className={styles.required}>*</span>
                  </span>
                  <RichTextEditor
                    value={description}
                    onChange={setDescription}
                    placeholder="Nhập nội dung mô tả, yêu cầu đề bài, định dạng nộp bài..."
                    variant="basic"
                    rows={10}
                    required
                    toolbarAriaLabel="Định dạng văn bản"
                  />
                </div>
              </div>

              <div className={styles["col-right"]}>
                <div className={styles.uploadSection}>
                  <div className={styles["upload-head"]}>
                    <div>
                      <p className={styles.label}>File đính kèm</p>
                      <p className={styles.hint}>Đề thi, source code, data...</p>
                    </div>
                    <span className={styles.limit}>Tối đa {MAX_FILE_MB}MB</span>
                  </div>

                  <div
                    className={`${styles.dropzone} ${isDragging ? styles["dropzone-active"] : ""}`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                  >
                    <FontAwesomeIcon icon={faCloudArrowUp} className={styles["drop-icon"]} />
                    <p className={styles["drop-text"]}>
                      Kéo thả file vào đây hoặc{" "}
                      <button
                        type="button"
                        className={styles.browse}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Duyệt file từ máy tính
                      </button>
                    </p>
                    <p className={styles.formats}>PDF, ZIP, RAR, DOCX</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className={styles["file-input"]}
                      accept={ACCEPTED_TYPES}
                      multiple
                      onChange={handleFileInput}
                    />
                  </div>

                  <ul className={styles.files}>
                    {attachments.map((file) => (
                      <li key={file.id} className={styles.file}>
                        <div className={styles["file-icon-wrap"]}>
                          <FileTypeIcon type={file.type} />
                        </div>
                        <div className={styles["file-meta"]}>
                          <p className={styles["file-name"]}>{file.name}</p>
                          <p className={styles["file-status"]}>
                            {file.sizeLabel}
                            {file.status === "done"
                              ? file.existing
                                ? " • File hiện có"
                                : " • Tải lên xong"
                              : file.status === "error"
                                ? ` • ${file.error ?? "Lỗi tải lên"}`
                                : ` • Đang tải... ${file.progress}%`}
                          </p>
                        </div>
                        <button
                          type="button"
                          className={styles.removeFile}
                          onClick={() => removeAttachment(file.id)}
                          aria-label={`Xóa ${file.name}`}
                          disabled={file.status === "uploading"}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                        {file.status === "uploading" && (
                          <div
                            className={styles.spinner}
                            role="progressbar"
                            aria-valuenow={file.progress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={styles.settings}>
                  <h3 className={styles["settings-title"]}>
                    <FontAwesomeIcon icon={faGear} />
                    Tùy chọn đề thi
                  </h3>

                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={pinExam}
                      onChange={(event) => setPinExam(event.target.checked)}
                      aria-describedby="pin-exam-hint"
                    />
                    <span className={styles["checkbox-box"]} aria-hidden />
                    <span>
                      <span className={styles["checkbox-label"]}>Ghim đề thi</span>
                      <span id="pin-exam-hint" className={styles["checkbox-hint"]}>
                        Đề được ghim hiển thị đầu danh sách trên trang môn. Mỗi môn chỉ ghim 1 đề.
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </form>
      )}
    </section>
  );

  if (isAdminFlow) {
    return (
      <AdminPageLayout
        title="Thêm đề thi thực hành"
        subtitle="Upload file đề và xuất bản trực tiếp."
        breadcrumbs={adminCrumbs}
        actions={pageActions}
      >
        {pageBody}
      </AdminPageLayout>
    );
  }

  return (
    <ModeratorPageShell
      title={
        isEditMode
          ? isRevisionEdit
            ? "Cập nhật đề thực hành đã xuất bản"
            : "Sửa & gửi lại đề thực hành"
          : "Thêm đề thi thực hành"
      }
      crumbs={isEditMode ? EDIT_PRACTICE_CRUMBS : MOD_PRACTICE_CRUMBS}
      actions={pageActions}
    >
      {pageBody}
    </ModeratorPageShell>
  );
}

export default AddPracticeExamPage;
