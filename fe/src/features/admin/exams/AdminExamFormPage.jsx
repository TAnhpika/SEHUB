import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { mapWizardQuestionsToCreateItems } from "@/api/adminMapper";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import { extractCourseSubjectCode } from "@/utils/examDisplay";
import AdminPageLayout from "@/features/admin/shared/AdminPageLayout";
import FinalExamInfoFields from "@/features/exams/finalExam/FinalExamInfoFields";
import FinalExamMarkdownImportPanel from "@/features/exams/finalExam/FinalExamMarkdownImportPanel";
import QuestionEditorCard from "@/features/moderator/finalExams/components/QuestionEditorCard";
import {
  semesterIdToLabel,
  semesterLabelToId,
} from "@/features/exams/finalExam/semesterUtils";
import {
  isQuestionComplete,
  mapImportedExamQuestions,
  parseTotalQuestions,
} from "@/features/moderator/finalExams/finalExamData";
import {
  createDefaultExamTermFields,
  parseTermFromExamCode,
} from "@/features/exams/finalExam/examTermOptions";
import {
  DEMO_DUPLICATE_SHA,
  EXAM_TYPE_OPTIONS,
  FINAL_EXAM_DEFAULTS,
  PRACTICE_EXAM_DEFAULTS,
  buildMockOcrImportQuestions,
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
import questionStyles from "@/features/moderator/finalExams/steps/FinalExamQuestionsStep.module.css";
import styles from "@/features/admin/shared/adminPage.module.css";

const STEPS_FINAL = ["Thông tin", "Upload & OCR", "Rà soát câu hỏi"];
const STEPS_PRACTICE = ["Thông tin", "Nội dung đề", "Xác nhận"];

function buildInitialForm(exam) {
  const defaultTerm = createDefaultExamTermFields();

  if (!exam) {
    return {
      typeKey: "final",
      code: "",
      title: "",
      subjectName: "",
      track: "SE",
      semester: "5",
      ...defaultTerm,
      description: "",
      githubGuide: PRACTICE_EXAM_DEFAULTS.githubGuide,
      deadline: "",
      durationMinutes: FINAL_EXAM_DEFAULTS.durationMinutes,
      totalQuestions: FINAL_EXAM_DEFAULTS.maxQuestions,
      attachments: [],
    };
  }

  const paperCode = exam.displayExamCode ?? exam.title ?? exam.code;
  const parsedTerm = parseTermFromExamCode(paperCode);

  return {
    typeKey: exam.typeKey ?? "final",
    code:
      exam.subjectCode ?? extractCourseSubjectCode(exam.code, exam.title) ?? exam.code,
    title: paperCode,
    subjectName: exam.subjectName ?? "",
    track: exam.track,
    semester: exam.semester,
    termSeason: parsedTerm?.termSeason ?? defaultTerm.termSeason,
    academicYear: parsedTerm?.academicYear ?? defaultTerm.academicYear,
    description: exam.description ?? "",
    githubGuide: exam.githubGuide ?? PRACTICE_EXAM_DEFAULTS.githubGuide,
    deadline: exam.deadline ?? "",
    durationMinutes: exam.durationMinutes ?? FINAL_EXAM_DEFAULTS.durationMinutes,
    totalQuestions: exam.questionCount ?? FINAL_EXAM_DEFAULTS.maxQuestions,
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
  const [editableQuestions, setEditableQuestions] = useState([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [importingMarkdown, setImportingMarkdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [questionCountInput, setQuestionCountInput] = useState(() =>
    String(FINAL_EXAM_DEFAULTS.maxQuestions),
  );
  const [finalInputMode, setFinalInputMode] = useState("upload");

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
        setQuestionCountInput(String(loaded.questionCount ?? FINAL_EXAM_DEFAULTS.maxQuestions));
        setSha256(loaded.sha256 ?? "");
        setOcrDone(Boolean(loaded.questionCount && loaded.typeKey === "final"));
        setOcrConfirmed(
          Boolean(loaded.ocrConfirmed ?? (loaded.typeKey === "final" && loaded.questionCount > 0)),
        );
        if (loaded.typeKey === "final" && Array.isArray(loaded.questions) && loaded.questions.length > 0) {
          setEditableQuestions(mapImportedExamQuestions(loaded.questions));
        }
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
    const defaultTerm = createDefaultExamTermFields();
    patchForm({
      typeKey,
      code: "",
      title: "",
      subjectName: "",
      termSeason: defaultTerm.termSeason,
      academicYear: defaultTerm.academicYear,
      deadline: "",
      attachments: [],
      description: "",
      githubGuide: PRACTICE_EXAM_DEFAULTS.githubGuide,
    });
    setStep(0);
    setFileName("");
    setPdfFile(null);
    setSha256("");
    setOcrDone(false);
    setOcrConfirmed(false);
    setForceUniqueSha(false);
    setQuestionCountInput(String(FINAL_EXAM_DEFAULTS.maxQuestions));
    setEditableQuestions([]);
    setActiveQuestionIndex(0);
    setMarkdownText("");
  }

  function applyImportedQuestions(imported, warnings = []) {
    const mapped = mapImportedExamQuestions(imported, warnings);
    setEditableQuestions(mapped);
    setActiveQuestionIndex(0);
    setOcrDone(true);
    setOcrConfirmed(false);
    patchForm({ totalQuestions: mapped.length });
  }

  function updateActiveQuestion(patch) {
    setEditableQuestions((prev) =>
      prev.map((question, index) =>
        index === activeQuestionIndex ? { ...question, ...patch } : question,
      ),
    );
  }

  function updateActiveAnswer(key, value) {
    setEditableQuestions((prev) =>
      prev.map((question, index) =>
        index === activeQuestionIndex
          ? { ...question, answers: { ...question.answers, [key]: value } }
          : question,
      ),
    );
  }

  function validateStep0() {
    if (isFinal || isPractice) {
      if (!form.semester || !semesterIdToLabel(form.semester)) {
        showToast("Vui lòng chọn học kỳ.");
        return false;
      }
      if (!form.code.trim()) {
        showToast("Vui lòng chọn mã môn học.");
        return false;
      }
      if (!form.title.trim()) {
        showToast("Vui lòng chọn môn, kỳ học và năm học để sinh mã đề thi.");
        return false;
      }
      if (!form.termSeason?.trim() || !form.academicYear?.trim()) {
        showToast("Vui lòng chọn kỳ học (SP/SU/FA) và năm học.");
        return false;
      }
      if (form.durationMinutes < 15 || form.durationMinutes > 180) {
        showToast("Thời gian làm bài phải từ 15 đến 180 phút.");
        return false;
      }
      if (isFinal) {
        const totalQuestions = parseTotalQuestions(questionCountInput);
        if (totalQuestions === null) {
          showToast("Số câu hỏi phải lớn hơn 0.");
          return false;
        }
        patchForm({ totalQuestions });
      }
      return true;
    }

    return true;
  }

  function validateStep1() {
    if (isFinal) {
      if (!fileName && editableQuestions.length === 0 && !isEdit) {
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
    if (!sha256) setSha256(mockComputeSha256());
    applyImportedQuestions(buildMockOcrImportQuestions());
    setForceUniqueSha(false);
    setStep(2);
    showToast("OCR hoàn tất — rà soát đáp án trước khi lưu.");
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

      const warnings = result?.warnings ?? [];
      applyImportedQuestions(questions, warnings);
      setStep(2);

      const skippedCount = warnings.length;
      if (skippedCount > 0) {
        const preview = warnings.slice(0, 2).join(" · ");
        const suffix = skippedCount > 2 ? ` · +${skippedCount - 2} cảnh báo` : "";
        showToast(
          `Đã import ${questions.length} câu. ${skippedCount} câu không hợp lệ: ${preview}${suffix}`,
          6000,
        );
      } else {
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
      }
    } catch (err) {
      showToast(err.message ?? "Import Markdown thất bại.");
    } finally {
      setImportingMarkdown(false);
    }
  }

  const activeQuestion = editableQuestions[activeQuestionIndex] ?? null;
  const questionCompleteCount = useMemo(
    () => editableQuestions.filter(isQuestionComplete).length,
    [editableQuestions],
  );
  const questionProgressPercent =
    editableQuestions.length > 0
      ? Math.round((questionCompleteCount / editableQuestions.length) * 100)
      : 0;

  function getQuestionsForSave() {
    return mapWizardQuestionsToCreateItems(editableQuestions);
  }

  function goNext() {
    if (step === 0 && !validateStep0()) return;
    if (step === 1 && !validateStep1()) return;
    if (step === 1 && isFinal && fileName && !ocrDone && editableQuestions.length === 0) {
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
          ? getQuestionsForSave()
          : [],
      questionsAreCreateItems: true,
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
        showToast("Tick xác nhận đã rà soát đáp án.");
        return;
      }
      if (questionCompleteCount < 1) {
        showToast("Cần ít nhất một câu hỏi hoàn chỉnh trước khi publish.");
        return;
      }
    } else if (form.attachments.length === 0) {
      showToast("Cần upload file đề thực hành (PDF/ảnh/ZIP).");
      return;
    }

    setIsPublishing(true);
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
      setIsPublishing(false);
      setIsSubmitting(false);
    }
  }

  const summaryItems = useMemo(
    () => [
      { label: "Loại", value: isFinal ? "Cuối kỳ" : "Thực hành" },
      {
        label: "Môn học",
        value: form.subjectName
          ? `${form.code || "—"} — ${form.subjectName}`
          : form.code || "—",
      },
      { label: "Mã đề thi", value: form.title || "—" },
      { label: "Ngành", value: getTrackLabel(form.track) },
      { label: "Học kỳ", value: getSemesterLabel(form.semester) },
      {
        label: "Kỳ học",
        value:
          form.termSeason && form.academicYear
            ? `${form.termSeason} ${form.academicYear}`
            : "—",
      },
      { label: "Thời gian làm bài", value: `${form.durationMinutes} phút` },
      isFinal
        ? {
            label: "Số câu",
            value:
              editableQuestions.length > 0
                ? `${questionCompleteCount}/${editableQuestions.length} hoàn chỉnh`
                : "—",
          }
        : { label: "Hạn nộp bài", value: form.deadline || "Chưa đặt" },
      isPractice
        ? { label: "File đính kèm", value: String(form.attachments.length) }
        : null,
    ].filter(Boolean),
    [form, isFinal, isPractice, editableQuestions.length, questionCompleteCount],
  );

  function handleFinalInfoChange(patch) {
    const updates = {};
    if ("semesterLabel" in patch) {
      updates.semester = semesterLabelToId(patch.semesterLabel);
    }
    if ("subjectCode" in patch) {
      updates.code = patch.subjectCode;
    }
    if ("subjectName" in patch) {
      updates.subjectName = patch.subjectName;
    }
    if ("termSeason" in patch) {
      updates.termSeason = patch.termSeason;
    }
    if ("academicYear" in patch) {
      updates.academicYear = patch.academicYear;
    }
    if ("major" in patch) {
      updates.track = patch.major;
    }
    if ("examCode" in patch) {
      updates.title = patch.examCode;
    }
    if ("durationMinutes" in patch) {
      updates.durationMinutes = patch.durationMinutes;
    }
    patchForm(updates);
  }

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
              {isFinal
                ? "Chọn học kỳ, mã môn và mã đề — mã đề tự sinh theo quy tắc FE-{môn}-{kỳ}-{số thứ tự}."
                : "Chọn học kỳ, mã môn và mã đề — mã đề tự sinh theo quy tắc PE-{môn}-{kỳ}-{số thứ tự}."}
            </p>
            <div className={styles.divider} />

            {isFinal ? (
              <FinalExamInfoFields
                value={{
                  semesterLabel: semesterIdToLabel(form.semester),
                  subjectCode: form.code,
                  subjectName: form.subjectName ?? "",
                  termSeason: form.termSeason,
                  academicYear: form.academicYear,
                  examCode: form.title,
                  durationMinutes: form.durationMinutes,
                }}
                onChange={handleFinalInfoChange}
                isEditMode={isEdit}
                questionCountInput={questionCountInput}
                onQuestionCountInputChange={setQuestionCountInput}
              />
            ) : (
              <>
                <FinalExamInfoFields
                  examType="practice"
                  showQuestionCount={false}
                  value={{
                    semesterLabel: semesterIdToLabel(form.semester),
                    subjectCode: form.code,
                    subjectName: form.subjectName ?? "",
                    termSeason: form.termSeason,
                    academicYear: form.academicYear,
                    examCode: form.title,
                    durationMinutes: form.durationMinutes,
                  }}
                  onChange={handleFinalInfoChange}
                  isEditMode={isEdit}
                />

                <label className={styles.field}>
                  <span className={styles.label}>Hạn nộp bài</span>
                  <input
                    type="date"
                    className={styles.input}
                    value={form.deadline}
                    onChange={(e) => patchForm({ deadline: e.target.value })}
                  />
                </label>
              </>
            )}

            <div className={formStyles.formActions}>
              <div className={formStyles.formActionsRight}>
                <Button type="button" onClick={goNext}>
                  Tiếp theo
                </Button>
              </div>
            </div>
          </>
        ) : null}

        {step === 1 && isFinal ? (
          <>
            <h2 className={styles.panelTitle}>Upload đề, OCR hoặc Markdown</h2>
            <p className={styles.panelDesc}>
              Upload PDF/ảnh để OCR, hoặc import câu hỏi bằng Markdown (cùng định dạng với luồng Moderator).
            </p>
            <div className={styles.divider} />

            <FinalExamMarkdownImportPanel
              showModeSwitch
              inputMode={finalInputMode}
              onInputModeChange={setFinalInputMode}
              markdownText={markdownText}
              onMarkdownChange={setMarkdownText}
              onImport={handleImportMarkdown}
              importing={importingMarkdown}
              importLabel="Import Markdown và rà soát câu hỏi"
              fileName={fileName}
              onFileChange={handleFileChange}
              onRunOcr={runOcr}
              ocrLabel="Chạy OCR & sang bước xác nhận"
              maxQuestions={FINAL_EXAM_DEFAULTS.maxQuestions}
            />

            <div className={formStyles.formActions}>
              <div className={formStyles.formActionsRight}>
                <Button type="button" look="outline" onClick={() => setStep(0)}>
                  Quay lại
                </Button>
              </div>
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
              <div className={formStyles.formActionsRight}>
                <Button type="button" look="outline" onClick={() => setStep(0)}>
                  Quay lại
                </Button>
                <Button type="button" onClick={goNext}>
                  Tiếp — Xác nhận
                </Button>
              </div>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h2 className={styles.panelTitle}>
              {isFinal && ocrDone ? "Rà soát câu hỏi" : "Xác nhận trước khi lưu"}
            </h2>
            <p className={styles.panelDesc}>
              {isFinal
                ? "Chỉnh sửa nội dung, đáp án và giải thích — giống luồng Moderator trước khi publish (§4.2)."
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

            {isFinal && ocrDone && activeQuestion ? (
              <div className={formStyles.questionReview}>
                <section className={questionStyles.summary}>
                  <div className={questionStyles.summaryHead}>
                    <div>
                      <h3 className={questionStyles.title}>Nhập câu hỏi trắc nghiệm</h3>
                      <p className={questionStyles.subtitle}>
                        {form.subjectName
                          ? `${form.code} — ${form.subjectName}`
                          : form.code || "Đề cuối kỳ"}
                        {form.semester ? ` · ${getSemesterLabel(form.semester)}` : ""}
                      </p>
                    </div>
                    <p className={questionStyles.count}>
                      Hoàn thiện: {questionCompleteCount}/{editableQuestions.length} câu
                    </p>
                  </div>
                  <div
                    className={questionStyles.progress}
                    role="progressbar"
                    aria-valuenow={questionProgressPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={questionStyles.progressFill}
                      style={{ width: `${questionProgressPercent}%` }}
                    />
                  </div>
                </section>

                <QuestionEditorCard
                  questionNumber={activeQuestionIndex + 1}
                  question={activeQuestion}
                  importWarnings={activeQuestion.importWarnings}
                  onChange={updateActiveQuestion}
                  onAnswerChange={updateActiveAnswer}
                  onCorrectAnswerChange={(key) => updateActiveQuestion({ correctAnswer: key })}
                  onCorrectAnswersChange={(correctAnswers) =>
                    updateActiveQuestion({ correctAnswers })
                  }
                  onToggleExplanation={() =>
                    updateActiveQuestion({
                      showExplanation: !activeQuestion.showExplanation,
                    })
                  }
                />

                {editableQuestions.length > 1 ? (
                  <div className={questionStyles.picker}>
                    <span className={questionStyles.pickerLabel}>
                      Chuyển câu ({editableQuestions.length} câu):
                    </span>
                    <div className={questionStyles.pickerList}>
                      {editableQuestions.map((item, index) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`${questionStyles.pickerBtn} ${
                            index === activeQuestionIndex ? questionStyles["pickerBtn-active"] : ""
                          } ${isQuestionComplete(item) ? questionStyles["pickerBtn-complete"] : ""} ${
                            item.importWarnings?.length ? questionStyles["pickerBtn-warning"] : ""
                          }`}
                          onClick={() => setActiveQuestionIndex(index)}
                          title={
                            item.importWarnings?.length
                              ? item.importWarnings.join(" · ")
                              : undefined
                          }
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className={formStyles.confirmRow}>
                  <input
                    id="ocr-confirm"
                    type="checkbox"
                    checked={ocrConfirmed}
                    onChange={(e) => setOcrConfirmed(e.target.checked)}
                  />
                  <label htmlFor="ocr-confirm">
                    Tôi đã rà soát nội dung và đáp án đúng. Cho phép lưu đề cuối kỳ lên hệ thống.
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
              <Button
                type="button"
                look="outline"
                onClick={handleDraft}
                disabled={blockSave || isSubmitting}
              >
                Lưu nháp
              </Button>
              <div className={formStyles.formActionsRight}>
                <Button type="button" look="outline" onClick={() => setStep(1)} disabled={isSubmitting}>
                  Quay lại
                </Button>
                <Button
                  type="submit"
                  disabled={
                    blockSave ||
                    isSubmitting ||
                    (isFinal && (!ocrDone || !ocrConfirmed || questionCompleteCount < 1))
                  }
                  loading={isPublishing}
                  loadingLabel="Đang publish..."
                >
                  {isEdit ? "Lưu & xuất bản" : "Publish đề thi"}
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </form>
    </AdminPageLayout>
  );
}

export default AdminExamFormPage;
