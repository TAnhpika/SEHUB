import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faClock,
  faCloudArrowUp,
  faFile,
  faLaptopCode,
  faPaperPlane,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import Button from "@/common/Button/Button";
import RichTextContent from "@/common/RichTextEditor/RichTextContent";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { buildExamQuestions, EXAM_USE_MOCK, loadExamMeta } from "@/features/exams/examDetailData";
import ExamAttachmentViewer from "@/features/exams/ExamAttachmentViewer/ExamAttachmentViewer";
import PracticeBriefPanel from "@/features/exams/PracticeBriefPanel/PracticeBriefPanel";
import { getPracticeBrief } from "@/features/exams/practiceBriefData";
import { formatDuration } from "@/features/exams/examSession";
import {
  formatFileSize,
  getOrCreatePracticeSession,
  getPracticeSession,
  isValidGithubUrl,
  PRACTICE_DURATION_MS,
  savePracticeSubmission,
  submitPracticeSession,
} from "@/features/exams/practiceSession";
import { submitPracticeExamAsync } from "@/features/exams/practiceExamSubmissions";
import {
  getExamById,
  getSubjectDetailConfig,
} from "@/features/subjects/SubjectDetailPage/subjectDetailData";
import {
  getExamDetailPath,
  getPracticeResultPath,
  resolveExamScope,
} from "@/utils/examFocusPaths";
import styles from "./PracticeDoPage.module.css";

const ACCEPTED_TYPES = ".zip,.rar,.pdf,.doc,.docx,.c,.cpp,.java,.py,.js,.ts";
const MAX_FILE_MB = 25;
const PRACTICE_DURATION_MINUTES = PRACTICE_DURATION_MS / (60 * 1000);

function PracticeDoPage() {
  const { courseCode, examId, questionIndex } = useParams();
  const navigate = useNavigate();
  const { pathname, state: locationState } = useLocation();
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();
  const { user, isPremium } = useAuth();
  const fileInputRef = useRef(null);
  const scope = resolveExamScope(pathname, locationState);
  const config = getSubjectDetailConfig("practice", scope);
  const decodedExamId = decodeURIComponent(examId ?? "");
  const questionNumber = Math.max(1, Number(questionIndex) || 1);

  const [exam, setExam] = useState(null);
  const [apiExamId, setApiExamId] = useState(null);
  const [examReady, setExamReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchExam() {
      setExamReady(false);
      if (EXAM_USE_MOCK) {
        const mockExam = getExamById(courseCode, decodedExamId, "practice", scope);
        if (mockExam) {
          if (!cancelled) {
            setExam(mockExam);
            setApiExamId(null);
            setExamReady(true);
          }
          return;
        }
      }

      try {
        const meta = await loadExamMeta(courseCode, decodedExamId, "practice", scope, {
          apiExamId: locationState?.apiExamId,
        });
        if (!cancelled) {
          setExam(meta?.exam ?? null);
          setApiExamId(meta?.apiExamId ?? null);
        }
      } catch {
        if (!cancelled) {
          setExam(null);
        }
      } finally {
        if (!cancelled) {
          setExamReady(true);
        }
      }
    }

    fetchExam();
    return () => {
      cancelled = true;
    };
  }, [courseCode, decodedExamId, scope, locationState?.apiExamId]);

  const questions = useMemo(
    () => (exam ? buildExamQuestions(exam.questionCount, "practice") : []),
    [exam],
  );

  const question = questions[questionNumber - 1];

  const practiceBrief = useMemo(() => {
    if (!exam || !question || (apiExamId && (exam.attachments?.length ?? 0) > 0)) {
      return null;
    }
    return getPracticeBrief(exam.id, question.id, exam.courseCode, question.text);
  }, [apiExamId, exam, question]);

  const hasApiAttachments = Boolean(apiExamId && (exam?.attachments?.length ?? 0) > 0);

  const [submitMode, setSubmitMode] = useState("file");
  const [githubUrl, setGithubUrl] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [timeRemainingMs, setTimeRemainingMs] = useState(PRACTICE_DURATION_MS);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [sessionReady, setSessionReady] = useState(false);

  const detailPath = exam
    ? getExamDetailPath(exam.courseCode, exam.id, scope, "practice")
    : config.detailBase;
  const resultPath = getPracticeResultPath(
    exam?.courseCode ?? courseCode ?? "",
    exam?.id ?? decodedExamId,
    questionNumber,
    scope,
  );

  useEffect(() => {
    if (!exam || !question) return;

    const existing = getPracticeSession(exam.id, question.id);
    if (existing?.submitted) {
      navigate(resultPath, { replace: true });
      return;
    }

    const session = existing ?? getOrCreatePracticeSession(exam.id, question.id);
    setStartedAt(session.startedAt ?? Date.now());
    setSessionReady(true);

    if (session.submission?.type === "github") {
      setSubmitMode("github");
      setGithubUrl(session.submission.value ?? "");
    } else if (session.submission?.type === "file") {
      setSubmitMode("file");
      setUploadedFile({
        name: session.submission.fileName,
        sizeLabel: session.submission.fileSizeLabel,
      });
    }
  }, [exam, question, resultPath, navigate]);

  useEffect(() => {
    if (!sessionReady) return;

    document.title = exam
      ? `Bài TH ${questionNumber} — ${exam.id} | SEHUB`
      : "Làm bài thực hành | SEHUB";
    return () => {
      document.title = "SEHUB";
    };
  }, [sessionReady, exam, questionNumber]);

  useEffect(() => {
    if (!sessionReady) return;

    const timer = window.setInterval(() => {
      setTimeRemainingMs(Math.max(0, PRACTICE_DURATION_MS - (Date.now() - startedAt)));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [sessionReady, startedAt]);

  if (!examReady) {
    return (
      <div className={styles.page}>
        <p>Đang tải bài thực hành...</p>
      </div>
    );
  }

  if (!exam) {
    return <Navigate to={`${config.detailBase}/${courseCode?.toUpperCase()}`} replace />;
  }

  if (!question || !sessionReady) {
    if (!question) {
      return <Navigate to={detailPath} replace />;
    }
    return null;
  }

  const isExpired = timeRemainingMs <= 0;
  const isTimeCritical = !isExpired && timeRemainingMs <= 10 * 60 * 1000;
  const hasValidFile = Boolean(uploadedFile?.name);
  const hasValidGithub = isValidGithubUrl(githubUrl);
  const canSubmit = !isExpired && (submitMode === "file" ? hasValidFile : hasValidGithub);
  const displayTime = isExpired ? "Hết giờ" : formatDuration(timeRemainingMs);

  function persistSubmission(nextSubmission) {
    savePracticeSubmission(exam.id, question.id, nextSubmission);
  }

  function handleFileSelect(fileList) {
    const file = fileList?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      showToast(`File không được vượt quá ${MAX_FILE_MB}MB.`);
      return;
    }

    const nextFile = {
      name: file.name,
      sizeLabel: formatFileSize(file.size),
    };
    setUploadedFile(nextFile);
    persistSubmission({
      type: "file",
      fileName: file.name,
      fileSizeLabel: nextFile.sizeLabel,
    });
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    handleFileSelect(event.dataTransfer.files);
  }

  function handleGithubChange(value) {
    setGithubUrl(value);
    if (isValidGithubUrl(value)) {
      persistSubmission({ type: "github", value: value.trim() });
    }
  }

  async function handleSubmit() {
    if (isExpired) {
      showToast(`Đã hết thời gian làm bài (${PRACTICE_DURATION_MINUTES} phút).`);
      return;
    }

    const submission =
      submitMode === "file"
        ? {
            type: "file",
            fileName: uploadedFile.name,
            fileSizeLabel: uploadedFile.sizeLabel,
          }
        : {
            type: "github",
            value: githubUrl.trim(),
          };

    if (submitMode === "file" && !hasValidFile) {
      showToast("Vui lòng chọn file để nộp bài.");
      return;
    }

    if (submitMode === "github" && !hasValidGithub) {
      showToast("Vui lòng nhập link GitHub hợp lệ.");
      return;
    }

    const confirmed = await confirm({
      title: "Nộp bài thực hành",
      description: "Bạn có chắc muốn nộp bài thực hành này?",
      confirmLabel: "Nộp bài",
    });
    if (!confirmed) {
      return;
    }

    submitPracticeSession(exam.id, question.id, question, submission);

    if (submitMode === "github" && isPremium && user) {
      try {
        await submitPracticeExamAsync({
          courseCode,
          examId: exam.id,
          student: user.username,
          displayName: user.displayName ?? user.username,
          githubUrl: githubUrl.trim(),
        });
      } catch {
        /* local session saved; ExamDetail panel reflects API state when available */
      }
    }

    showToast(
      submitMode === "github" && isPremium
        ? "Đã nộp bài — chờ Mod/Admin chấm."
        : "Đã nộp bài — kết quả sẽ được cập nhật sau khi được chấm.",
    );
    navigate(resultPath);
  }

  const timerClassName = [
    styles.timer,
    isExpired && styles["timer-expired"],
    isTimeCritical && styles["timer-critical"],
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.page}>
      <Link to={detailPath} className={styles.back}>
        <FontAwesomeIcon icon={faArrowLeft} />
        Quay lại đề thi
      </Link>

      <p className={styles["external-notice"]}>
        <FontAwesomeIcon icon={faLaptopCode} className={styles["external-notice-icon"]} />
        Làm bài trên IDE/editor bên ngoài (VS Code, IntelliJ…). Bạn có thể rời SEHUB và quay lại
        trang này để nộp file hoặc link GitHub.
      </p>

      <section className={styles.panel} aria-label="Làm bài thực hành">
        <header className={styles.header}>
          <div className={styles["header-main"]}>
            <h1 className={styles["exam-code"]}>{exam.id}</h1>
            <p className={styles.meta}>
              Bài thực hành {questionNumber} / {exam.questionCount} · Thời gian mỗi bài:{" "}
              {PRACTICE_DURATION_MINUTES} phút
            </p>
          </div>

          <div className={styles["header-actions"]}>
            <span className={timerClassName} aria-live="polite">
              <FontAwesomeIcon icon={faClock} />
              {isExpired ? "Hết giờ" : displayTime}
            </span>
            <Button size="sm" onClick={handleSubmit} disabled={!canSubmit}>
              <FontAwesomeIcon icon={faPaperPlane} />
              Nộp bài
            </Button>
          </div>
        </header>

        <div className={styles.body}>
          <article className={styles.question}>
            {!hasApiAttachments ? (
              <>
                <p className={styles["question-label"]}>Bài thực hành {questionNumber}</p>
                <p className={styles["question-text"]}>{question.text}</p>
              </>
            ) : null}

            {hasApiAttachments ? (
              <ExamAttachmentViewer examApiId={apiExamId} attachments={exam.attachments} />
            ) : null}

            {hasApiAttachments && exam.description ? (
              <RichTextContent value={exam.description} className={styles["question-text"]} />
            ) : null}

            {practiceBrief ? (
              <PracticeBriefPanel brief={practiceBrief} canDownload />
            ) : null}

            <p className={styles.hint}>
              Tải đề PDF/ảnh/file ở trên về máy, triển khai trên môi trường local hoặc IDE của
              bạn. Nộp bài hoàn thành bằng file hoặc link GitHub public repo trong vòng{" "}
              {PRACTICE_DURATION_MINUTES} phút.
            </p>
          </article>

          <section className={styles.submit} aria-label="Nộp bài thực hành">
            <div className={styles["submit-tabs"]}>
              <button
                type="button"
                className={`${styles.tab} ${submitMode === "file" ? styles["tab-active"] : ""}`}
                onClick={() => setSubmitMode("file")}
              >
                <FontAwesomeIcon icon={faCloudArrowUp} />
                Nộp file
              </button>
              <button
                type="button"
                className={`${styles.tab} ${submitMode === "github" ? styles["tab-active"] : ""}`}
                onClick={() => setSubmitMode("github")}
              >
                <FontAwesomeIcon icon={faGithub} />
                Nộp GitHub
              </button>
            </div>

            {submitMode === "file" ? (
              <div className={styles["file-panel"]}>
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
                      duyệt file từ máy tính
                    </button>
                  </p>
                  <p className={styles.formats}>
                    ZIP, RAR, PDF, DOCX, source code · Tối đa {MAX_FILE_MB}MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className={styles["file-input"]}
                    accept={ACCEPTED_TYPES}
                    onChange={(event) => handleFileSelect(event.target.files)}
                  />
                </div>

                {uploadedFile && (
                  <div className={styles["file-preview"]}>
                    <FontAwesomeIcon icon={faFile} className={styles["file-preview-icon"]} />
                    <div className={styles["file-preview-meta"]}>
                      <p className={styles["file-preview-name"]}>{uploadedFile.name}</p>
                      <p className={styles["file-preview-size"]}>{uploadedFile.sizeLabel}</p>
                    </div>
                    <button
                      type="button"
                      className={styles["file-remove"]}
                      onClick={() => {
                        setUploadedFile(null);
                        persistSubmission(null);
                      }}
                      aria-label="Xóa file"
                    >
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles["github-panel"]}>
                <label className={styles["github-label"]} htmlFor="practice-github-url">
                  Link GitHub public repo
                </label>
                <div className={styles["github-input-wrap"]}>
                  <FontAwesomeIcon icon={faGithub} className={styles["github-icon"]} />
                  <input
                    id="practice-github-url"
                    type="url"
                    className={styles["github-input"]}
                    placeholder="https://github.com/username/repository"
                    value={githubUrl}
                    onChange={(event) => handleGithubChange(event.target.value)}
                  />
                </div>
                <p className={styles["github-hint"]}>
                  Repo phải public và có README mô tả cách chạy dự án.
                </p>
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

export default PracticeDoPage;
