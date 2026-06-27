import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { mapAdminReviewQuestion } from "@/api/adminMapper";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import { extractCourseSubjectCode } from "@/utils/examDisplay";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import {
  DEMO_DUPLICATE_SHA,
  EXAM_SEMESTERS,
  EXAM_TRACKS,
  EXAM_TYPE_OPTIONS,
  FINAL_EXAM_DEFAULTS,
  MOCK_OCR_QUESTIONS,
  PRACTICE_EXAM_DEFAULTS,
  findDuplicateBySha,
  getSemesterLabel,
  getTrackLabel,
  importExamQuestionsFromMarkdown,
  loadAdminExamById,
  loadAdminExams,
  mockComputeSha256,
  mockComputeSha256Unique,
  saveAdminExamViaApi,
  updateAdminExamViaApi,
} from "@/features/admin/exams/adminExamData";
import examStyles from "@/features/admin/exams/AdminExam.module.css";
import formStyles from "@/features/admin/exams/AdminExamFormPage.module.css";
import styles from "@/features/admin/shared/adminPage.module.css";

const STEPS_FINAL = ["Thông tin", "Upload & OCR", "Xác nhận"];
const STEPS_PRACTICE = ["Thông tin", "Nội dung đề", "Xác nhận"];

function buildInitialForm(exam) {
  if (!exam) {
    return {
      typeKey: "final",
      code: "",
      title: "",
      track: "SE",
      semester: "5",
      description: "",
      githubGuide: PRACTICE_EXAM_DEFAULTS.githubGuide,
      deadline: "",
      durationMinutes: FINAL_EXAM_DEFAULTS.durationMinutes,
      attachments: [],
    };
  }
  return {
    typeKey: exam.typeKey ?? "final",
    code:
      exam.typeKey === "final"
        ? exam.subjectCode ?? extractCourseSubjectCode(exam.code, exam.title) ?? exam.code
        : exam.code,
    title:
      exam.typeKey === "final"
        ? exam.displayExamCode ?? exam.code ?? exam.title
        : exam.title,
    track: exam.track,
    semester: exam.semester,
    description: exam.description ?? "",
    githubGuide: exam.githubGuide ?? PRACTICE_EXAM_DEFAULTS.githubGuide,
    deadline: exam.deadline ?? "",
    durationMinutes: exam.durationMinutes ?? FINAL_EXAM_DEFAULTS.durationMinutes,
    attachments: exam.attachments ?? [],
  };
}

function AdminExamFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEdit = Boolean(id);
  const [exam, setExam] = useState(null);
  const [loadingExam, setLoadingExam] = useState(isEdit);

  const [form, setForm] = useState(() => buildInitialForm(null));
  const [step, setStep] = useState(0);
  const [fileName, setFileName] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [sha256, setSha256] = useState("");
  const [ocrDone, setOcrDone] = useState(false);
  const [ocrConfirmed, setOcrConfirmed] = useState(false);
  const [forceUniqueSha, setForceUniqueSha] = useState(false);
  const [markdownText, setMarkdownText] = useState("");
  const [importedQuestions, setImportedQuestions] = useState([]);
  const [importingMarkdown, setImportingMarkdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) {
      return;
    }

    let cancelled = false;
    setLoadingExam(true);
    loadAdminExamById(id).then((loaded) => {
      if (cancelled) return;
      setExam(loaded);
      if (loaded) {
        setForm(buildInitialForm(loaded));
        setSha256(loaded.sha256 ?? "");
        setOcrDone(Boolean(loaded.questionCount && loaded.typeKey === "final"));
        setOcrConfirmed(
          Boolean(loaded.ocrConfirmed ?? (loaded.typeKey === "final" && loaded.questionCount > 0)),
        );
      }
      setLoadingExam(false);
    });

    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const isFinal = form.typeKey === "final";
  const isPractice = form.typeKey === "practice";
  const steps = isFinal ? STEPS_FINAL : STEPS_PRACTICE;

  const duplicate = sha256
    ? findDuplicateBySha(sha256, isEdit ? id : undefined)
    : null;
  const blockSave = duplicate && !forceUniqueSha;

  function patchForm(updates) {
    setForm((prev) => ({ ...prev, ...updates }));
  }

  function handleTypeChange(typeKey) {
    if (isEdit) return;
    patchForm({ typeKey });
    setStep(0);
    setFileName("");
    setPdfFile(null);
    setSha256("");
    setOcrDone(false);
    setOcrConfirmed(false);
    setForceUniqueSha(false);
  }

  function validateStep0() {
    if (!form.code.trim() || !form.title.trim()) {
      showToast(
        isFinal ? "Nhập mã môn học và mã đề thi." : "Nhập mã môn và tiêu đề đề thi.",
      );
      return false;
    }
    return true;
  }

  function validateStep1() {
    if (isFinal) {
      if (!fileName && importedQuestions.length === 0 && !isEdit) {
        showToast("Chọn file OCR hoặc import câu hỏi bằng Markdown.");
        return false;
      }
      return true;
    }
    if (form.attachments.length === 0) {
      showToast("Upload ít nhất một file đề (PDF/ảnh/ZIP).");
      return false;
    }
    return true;
  }

  function handleFileChange(event) {
    const fileList = event.target.files;
    if (!fileList?.length) return;

    if (isPractice) {
      const next = Array.from(fileList).map((file, index) => ({
        id: `f-${Date.now()}-${index}`,
        name: file.name,
        size: file.size,
        file,
      }));
      patchForm({ attachments: [...form.attachments, ...next] });
      event.target.value = "";
      return;
    }

    const file = fileList[0];
    setFileName(file.name);
    setPdfFile(file);
    const isDupDemo = file.name.toLowerCase().includes("dup");
    setSha256(isDupDemo ? DEMO_DUPLICATE_SHA : mockComputeSha256Unique());
    setForceUniqueSha(false);
    setOcrDone(false);
    setOcrConfirmed(false);
  }

  function removeAttachment(fileId) {
    patchForm({ attachments: form.attachments.filter((f) => f.id !== fileId) });
  }

  function runOcr() {
    if (!fileName) {
      showToast("Chọn file PDF/ảnh trước khi OCR.");
      return;
    }
    setOcrDone(true);
    if (!sha256) setSha256(mockComputeSha256());
    setStep(2);
    showToast("OCR hoàn tất — Admin rà soát đáp án trước khi lưu.");
  }

  async function handleImportMarkdown() {
    if (!markdownText.trim()) {
      showToast("Dán nội dung Markdown câu hỏi trước khi import.");
      return;
    }

    setImportingMarkdown(true);
    try {
      const result = await importExamQuestionsFromMarkdown(markdownText);
      const questions = result?.questions ?? [];
      if (!questions.length) {
        showToast("Không parse được câu hỏi từ Markdown.");
        return;
      }
      setImportedQuestions(questions);
      setOcrDone(true);
      setOcrConfirmed(false);
      setStep(2);
      const multiCount = questions.filter((question) => {
        const type = String(question.questionType ?? question.QuestionType ?? "").toLowerCase();
        const correctIds = question.correctOptionIds ?? question.CorrectOptionIds ?? [];
        return type === "multiselect" || correctIds.length > 1;
      }).length;
      showToast(
        multiCount > 0
          ? `Đã import ${questions.length} câu (${multiCount} câu chọn nhiều đáp án).`
          : `Đã import ${questions.length} câu hỏi từ Markdown.`,
      );
    } catch (err) {
      showToast(err.message ?? "Import Markdown thất bại.");
    } finally {
      setImportingMarkdown(false);
    }
  }

  const reviewQuestions = useMemo(() => {
    if (importedQuestions.length > 0) {
      return importedQuestions.map((question, index) => mapAdminReviewQuestion(question, index));
    }

    return MOCK_OCR_QUESTIONS.map((question, index) => mapAdminReviewQuestion(question, index));
  }, [importedQuestions]);

  function goNext() {
    if (step === 0 && !validateStep0()) return;
    if (step === 1 && !validateStep1()) return;
    if (step === 1 && isFinal && fileName && !ocrDone && importedQuestions.length === 0) {
      runOcr();
      return;
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  async function persist(status) {
    const saveOptions = {
      status,
      ocrQuestions:
        isFinal && ocrDone
          ? importedQuestions.length > 0
            ? importedQuestions
            : MOCK_OCR_QUESTIONS
          : [],
      pdfFile,
      confirmDuplicate: forceUniqueSha,
    };

    if (isEdit) {
      return updateAdminExamViaApi(id, form, saveOptions);
    }

    return saveAdminExamViaApi(form, saveOptions);
  }

  async function navigateAfterSave(targetPath, result, { published = false } = {}) {
    const items = await loadAdminExams();
    navigate(targetPath, {
      replace: !isEdit,
      state: {
        refreshExams: Date.now(),
        preloadedExams: items.length > 0 ? items : result?.listItem ? [result.listItem] : [],
        openStatusFilter: published ? "published" : "draft",
        fromExamSave: true,
      },
    });
  }

  async function handleDraft() {
    if (!form.code.trim() || !form.title.trim()) {
      showToast("Cần ít nhất mã môn và tiêu đề để lưu nháp.");
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await persist("draft");
      showToast("Đã lưu nháp.");
      navigateAfterSave(isEdit ? `/admin/exams/${id}` : "/admin/exams", result);
    } catch (err) {
      showToast(err.message ?? "Không lưu được bản nháp.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (blockSave) {
      showToast("Đề trùng SHA-256 — không thể lưu.");
      return;
    }
    if (isSubmitting) return;

    if (isFinal) {
      if (!ocrDone && !(isEdit && exam?.questionCount > 0)) {
        showToast("Cần chạy OCR và xác nhận câu hỏi trước khi publish.");
        return;
      }
      if (!ocrConfirmed) {
        showToast("Tick xác nhận đã rà soát đáp án OCR.");
        return;
      }
    } else if (form.attachments.length === 0) {
      showToast("Cần upload file đề thực hành (PDF/ảnh/ZIP).");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await persist("published");
      showToast(isEdit ? "Đã cập nhật và xuất bản." : "Đã tạo và xuất bản đề.");
      if (result?.uploadWarning) {
        showToast(result.uploadWarning);
      }
      navigateAfterSave(isEdit ? `/admin/exams/${id}` : "/admin/exams", result, {
        published: true,
      });
    } catch (err) {
      showToast(err.message ?? "Không xuất bản được đề thi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const summaryItems = useMemo(
    () => [
      { label: "Loại", value: isFinal ? "Cuối kỳ" : "Thực hành" },
      { label: "Mã môn", value: form.code || "—" },
      { label: isFinal ? "Mã đề thi" : "Tiêu đề", value: form.title || "—" },
      { label: "Ngành", value: getTrackLabel(form.track) },
      { label: "Kỳ", value: getSemesterLabel(form.semester) },
      isFinal
        ? { label: "Thời gian làm bài", value: `${form.durationMinutes} phút` }
        : { label: "Deadline", value: form.deadline || "Chưa đặt" },
      isFinal
        ? { label: "Số câu OCR", value: ocrDone ? String(MOCK_OCR_QUESTIONS.length) : "—" }
        : { label: "File đính kèm", value: String(form.attachments.length) },
    ],
    [form, isFinal, ocrDone],
  );

  if (isEdit && loadingExam) {
    return (
      <AdminPageLayout
        title="Đang tải đề..."
        breadcrumbs={[
          { label: "Dashboard", to: "/admin" },
          { label: "Quản lý đề thi", to: "/admin/exams" },
        ]}
      >
        <p className={styles.hint}>Đang tải thông tin đề thi.</p>
      </AdminPageLayout>
    );
  }

  if (isEdit && !exam) {
    return (
      <AdminPageLayout
        title="Không tìm thấy đề"
        breadcrumbs={[
          { label: "Dashboard", to: "/admin" },
          { label: "Quản lý đề thi", to: "/admin/exams" },
          { label: "Lỗi" },
        ]}
      >
        <p className={styles.hint}>Đề không tồn tại.</p>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={isEdit ? "Sửa đề thi" : "Thêm đề thi"}
      subtitle={
        isFinal
          ? "Admin tạo đề cuối kỳ: OCR → kiểm tra SHA-256 → xác nhận đáp án trước khi publish."
          : "Admin tạo đề thực hành: upload file đề (PDF/ảnh/ZIP) — giống luồng Moderator."
      }
      breadcrumbs={[
        { label: "Dashboard", to: "/admin" },
        { label: "Quản lý đề thi", to: "/admin/exams" },
        { label: isEdit ? "Sửa" : "Thêm mới" },
      ]}
      actions={
        <Button look="outline" to={isEdit ? `/admin/exams/${id}` : "/admin/exams"}>
          Hủy
        </Button>
      }
    >
      {!isEdit ? (
        <section className={formStyles.typeSection}>
          <p className={formStyles.typeSectionTitle}>Loại đề thi</p>
          <div className={formStyles.typeGrid}>
            {EXAM_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`${formStyles.typeCard} ${
                  form.typeKey === opt.key ? formStyles.typeCardActive : ""
                }`}
                onClick={() => handleTypeChange(opt.key)}
              >
                <span className={formStyles.typeCardLabel}>{opt.label}</span>
                <span className={formStyles.typeCardDesc}>{opt.description}</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <p className={formStyles.flowHint}>
          Đang sửa đề <strong>{exam.type}</strong> · {exam.code}. Đề từ Moderator duyệt tại{" "}
          <Link to="/admin/exams/pending" className={styles.link}>
            hàng chờ duyệt
          </Link>
          .
        </p>
      )}

      <div className={examStyles.stepBar} aria-label="Các bước">
        {steps.map((label, index) => (
          <span
            key={label}
            className={
              index === step
                ? `${examStyles.step} ${examStyles.stepActive}`
                : index < step
                  ? `${examStyles.step} ${examStyles.stepDone}`
                  : examStyles.step
            }
          >
            {index + 1}. {label}
          </span>
        ))}
      </div>

      {isFinal && duplicate ? (
        <div className={`${examStyles.alert} ${examStyles.alertDanger}`} role="alert">
          <div>
            <strong>Cảnh báo trùng SHA-256</strong>
            File trùng đề: [{duplicate.code}] {duplicate.title}.
            <code className={examStyles.shaBox}>{sha256}</code>
            <label style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", fontSize: "0.75rem" }}>
              <input
                type="checkbox"
                checked={forceUniqueSha}
                onChange={(e) => setForceUniqueSha(e.target.checked)}
              />
              Xác nhận bản sửa hợp lệ (ngoại lệ demo)
            </label>
          </div>
        </div>
      ) : isFinal && sha256 ? (
        <div className={`${examStyles.alert} ${examStyles.alertSuccess}`} role="status">
          <div>
            <strong>SHA-256 — không trùng đề trong hệ thống</strong>
            <code className={examStyles.shaBox}>{sha256}</code>
          </div>
        </div>
      ) : null}

      <form className={styles.panel} onSubmit={handleSubmit}>
        {step === 0 ? (
          <>
            <h2 className={styles.panelTitle}>Thông tin chung</h2>
            <p className={styles.panelDesc}>
              Lọc theo kỳ học (Kì 1–9) và chuyên ngành AI/SE — đồng bộ danh sách đề công khai.
            </p>
            <div className={styles.divider} />

            <div className={styles.formRow2}>
              <label className={styles.field}>
                <span className={styles.label}>Mã môn học *</span>
                <input
                  className={styles.input}
                  value={form.code}
                  onChange={(e) => patchForm({ code: e.target.value })}
                  placeholder="VD: PRF192"
                  required
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Kỳ học *</span>
                <select
                  className={styles.select}
                  value={form.semester}
                  onChange={(e) => patchForm({ semester: e.target.value })}
                >
                  {EXAM_SEMESTERS.filter((s) => s.id !== "all").map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className={styles.formRow2}>
              <label className={styles.field}>
                <span className={styles.label}>Chuyên ngành *</span>
                <select
                  className={styles.select}
                  value={form.track}
                  onChange={(e) => patchForm({ track: e.target.value })}
                >
                  {EXAM_TRACKS.filter((t) => t.id !== "all").map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              {isFinal ? (
                <label className={styles.field}>
                  <span className={styles.label}>Thời gian làm bài (phút)</span>
                  <input
                    type="number"
                    className={styles.input}
                    min={15}
                    max={180}
                    value={form.durationMinutes}
                    onChange={(e) =>
                      patchForm({ durationMinutes: Number(e.target.value) || 60 })
                    }
                  />
                </label>
              ) : (
                <label className={styles.field}>
                  <span className={styles.label}>Hạn nộp bài</span>
                  <input
                    type="date"
                    className={styles.input}
                    value={form.deadline}
                    onChange={(e) => patchForm({ deadline: e.target.value })}
                  />
                </label>
              )}
            </div>

            <label className={styles.field}>
              <span className={styles.label}>{isFinal ? "Mã đề thi *" : "Tiêu đề đề thi *"}</span>
              <input
                className={styles.input}
                value={form.title}
                onChange={(e) => patchForm({ title: e.target.value })}
                placeholder={
                  isFinal ? "VD: CEA201_SU25" : "VD: Thực hành PRF192 — Lab GitHub"
                }
                required
              />
            </label>

            <div className={formStyles.formActions}>
              <Button type="button" onClick={goNext}>
                Tiếp theo
              </Button>
            </div>
          </>
        ) : null}

        {step === 1 && isFinal ? (
          <>
            <h2 className={styles.panelTitle}>Upload đề, OCR hoặc Markdown</h2>
            <p className={styles.panelDesc}>
              Upload PDF/ảnh để OCR, hoặc dán file Markdown câu hỏi (## Câu 1, A./B./C./D., **Đáp án: X**).
            </p>
            <div className={styles.divider} />

            <label className={styles.field}>
              <span className={styles.label}>File đề (PDF / ảnh) *</span>
              <div className={styles.uploadZone}>
                <span className={styles.uploadText}>{fileName || "Kéo thả hoặc chọn file"}</span>
                <span className={styles.uploadHint}>
                  PDF, PNG, JPG — tối đa 50MB · Tối đa {FINAL_EXAM_DEFAULTS.maxQuestions} câu/lần làm
                </span>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  style={{ marginTop: "0.5rem" }}
                  onChange={handleFileChange}
                />
              </div>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Import câu hỏi bằng Markdown</span>
              <textarea
                className={styles.textarea}
                rows={10}
                value={markdownText}
                onChange={(e) => setMarkdownText(e.target.value)}
                placeholder={`## Câu 1\nNội dung câu hỏi?\n\nA. Phương án A\nB. Phương án B\nC. Phương án C\nD. Phương án D\n\n**Đáp án: B**`}
              />
              <p className={styles.hint}>
                Mỗi câu bắt đầu bằng ## Câu N (hoặc phân tách bằng ---). Dòng cuối: **Đáp án: X**.
              </p>
            </label>

            <div className={formStyles.formActions}>
              <Button type="button" look="outline" onClick={() => setStep(0)}>
                Quay lại
              </Button>
              <Button type="button" onClick={handleImportMarkdown} disabled={importingMarkdown}>
                {importingMarkdown ? "Đang import..." : "Import Markdown"}
              </Button>
              <Button type="button" onClick={runOcr} disabled={!fileName}>
                Chạy OCR &amp; sang bước xác nhận
              </Button>
            </div>
          </>
        ) : null}

        {step === 1 && isPractice ? (
          <>
            <h2 className={styles.panelTitle}>Upload đề thực hành</h2>
            <p className={styles.panelDesc}>
              Upload PDF/ảnh/ZIP đề bài — nội dung đề lấy từ file, không nhập thủ công (§3.4, giống
              Moderator). Sinh viên Premium nộp link GitHub; Mod/Admin chấm sau.
            </p>
            <div className={styles.divider} />

            <label className={styles.field}>
              <span className={styles.label}>File đề (PDF / ảnh / ZIP) *</span>
              <div className={styles.uploadZone}>
                <span className={styles.uploadText}>
                  {form.attachments.length > 0
                    ? `Đã chọn ${form.attachments.length} file`
                    : "Kéo thả hoặc chọn file đề từ máy tính"}
                </span>
                <span className={styles.uploadHint}>
                  PDF, PNG, JPG, ZIP, DOCX — tối đa 50MB · Có thể chọn nhiều file
                </span>
                <input
                  type="file"
                  accept=".pdf,image/*,.zip,.docx"
                  multiple
                  style={{ marginTop: "0.5rem" }}
                  onChange={handleFileChange}
                />
              </div>
              {form.attachments.length > 0 ? (
                <ul className={formStyles.fileList}>
                  {form.attachments.map((f) => (
                    <li key={f.id} className={formStyles.fileItem}>
                      <span>{f.name}</span>
                      <button
                        type="button"
                        className={formStyles.fileRemove}
                        onClick={() => removeAttachment(f.id)}
                      >
                        Xóa
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Ghi chú bổ sung (tùy chọn)</span>
              <textarea
                className={styles.textarea}
                rows={4}
                value={form.description}
                onChange={(e) => patchForm({ description: e.target.value })}
                placeholder="Rubric, tiêu chí chấm, lưu ý cho sinh viên..."
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Hướng dẫn nộp GitHub</span>
              <textarea
                className={styles.textarea}
                rows={3}
                value={form.githubGuide}
                onChange={(e) => patchForm({ githubGuide: e.target.value })}
              />
              <p className={styles.hint}>Mặc định theo quy định SEHUB — có thể chỉnh nếu cần.</p>
            </label>

            <div className={formStyles.formActions}>
              <Button type="button" look="outline" onClick={() => setStep(0)}>
                Quay lại
              </Button>
              <Button type="button" onClick={goNext}>
                Tiếp — Xác nhận
              </Button>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h2 className={styles.panelTitle}>Xác nhận trước khi lưu</h2>
            <p className={styles.panelDesc}>
              {isFinal
                ? "Admin review kết quả OCR — bắt buộc trước khi publish (§4.2)."
                : "Kiểm tra thông tin trước khi publish lên danh sách đề thực hành."}
            </p>
            <div className={styles.divider} />

            <dl className={formStyles.summaryGrid}>
              {summaryItems.map((item) => (
                <div key={item.label} className={formStyles.summaryItem}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>

            {isFinal && ocrDone ? (
              <div className={examStyles.ocrPanel}>
                <p className={examStyles.ocrPanelTitle}>
                  {reviewQuestions.length} câu {importedQuestions.length > 0 ? "Markdown" : "OCR"} — rà soát đáp án đúng
                </p>
                <ul className={examStyles.questionList}>
                  {reviewQuestions.map((q) => (
                    <li key={q.id} className={examStyles.questionItem}>
                      <p className={examStyles.questionText}>
                        Câu {q.id}. {q.text}
                        {q.isMulti ? (
                          <span className={examStyles.multiBadge}>
                            Chọn {q.requiredSelectCount} đáp án
                          </span>
                        ) : null}
                      </p>
                      <ol className={examStyles.optionList}>
                        {q.options.map((opt, i) => (
                          <li
                            key={`${q.id}-${i}`}
                            className={
                              q.correctIndices?.includes(i) ? examStyles.optionCorrect : undefined
                            }
                          >
                            {String.fromCharCode(65 + i)}. {opt}
                            {q.correctIndices?.includes(i) ? " ✓" : ""}
                          </li>
                        ))}
                      </ol>
                    </li>
                  ))}
                </ul>
                <div className={formStyles.confirmRow}>
                  <input
                    id="ocr-confirm"
                    type="checkbox"
                    checked={ocrConfirmed}
                    onChange={(e) => setOcrConfirmed(e.target.checked)}
                  />
                  <label htmlFor="ocr-confirm">
                    Tôi đã rà soát nội dung OCR và đáp án đúng. Cho phép lưu đề cuối kỳ lên hệ thống.
                  </label>
                </div>
              </div>
            ) : null}

            {isPractice ? (
              <div className={examStyles.ocrPanel}>
                <p className={examStyles.ocrPanelTitle}>File đề sẽ hiển thị với sinh viên</p>
                <ul className={formStyles.fileList}>
                  {form.attachments.map((f) => (
                    <li key={f.id} className={formStyles.fileItem}>
                      <span>{f.name}</span>
                    </li>
                  ))}
                </ul>
                {form.description.trim() ? (
                  <p className={styles.hint} style={{ margin: "0.75rem 0 0", whiteSpace: "pre-wrap" }}>
                    <strong>Ghi chú:</strong> {form.description}
                  </p>
                ) : null}
                <p className={styles.hint} style={{ marginTop: "0.75rem" }}>
                  <strong>GitHub:</strong> {form.githubGuide}
                </p>
              </div>
            ) : null}

            <div className={formStyles.formActions}>
              <Button type="button" look="outline" onClick={() => setStep(1)}>
                Quay lại
              </Button>
              <Button
                type="submit"
                disabled={blockSave || (isFinal && (!ocrDone || !ocrConfirmed))}
              >
                {isEdit ? "Lưu & xuất bản" : "Publish đề thi"}
              </Button>
              <Button type="button" look="outline" onClick={handleDraft} disabled={blockSave}>
                Lưu nháp
              </Button>
            </div>
          </>
        ) : null}
      </form>
    </AdminPageLayout>
  );
}

export default AdminExamFormPage;
