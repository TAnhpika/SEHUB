import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpFromBracket,
  faBold,
  faChevronRight,
  faCloudArrowUp,
  faCode,
  faFileArchive,
  faFilePdf,
  faGear,
  faItalic,
  faLink,
  faListOl,
  faListUl,
  faUnderline,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import {
  getAllPracticeSubmissions,
  getSubmissionStatusLabel,
} from "@/features/exams/practiceExamSubmissions";
import {
  DEMO_DRAFT,
  PRACTICE_SEMESTER_OPTIONS,
  PRACTICE_SUBJECT_OPTIONS,
} from "@/features/moderator/practiceExams/practiceExamData";
import styles from "./AddPracticeExamPage.module.css";

const ACCEPTED_TYPES = ".pdf,.zip,.rar,.docx";
const MAX_FILE_MB = 50;

function FileTypeIcon({ type }) {
  if (type === "pdf") {
    return <FontAwesomeIcon icon={faFilePdf} className={styles["file-icon-pdf"]} />;
  }
  return <FontAwesomeIcon icon={faFileArchive} className={styles["file-icon-zip"]} />;
}

function AddPracticeExamPage() {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("create");
  const [subject, setSubject] = useState(DEMO_DRAFT.subject);
  const [semester, setSemester] = useState(DEMO_DRAFT.semester);
  const [title, setTitle] = useState(DEMO_DRAFT.title);
  const [description, setDescription] = useState(DEMO_DRAFT.description);
  const [attachments, setAttachments] = useState(DEMO_DRAFT.attachments);
  const [allowDiscussion, setAllowDiscussion] = useState(DEMO_DRAFT.allowDiscussion);
  const [pinExam, setPinExam] = useState(DEMO_DRAFT.pinExam);
  const submissions = getAllPracticeSubmissions();
  const [isDragging, setIsDragging] = useState(false);

  function handleSaveDraft() {
    showToast("Đã lưu nháp đề thi thực hành.");
  }

  function handlePublish(event) {
    event.preventDefault();
    if (!subject || !semester || !title.trim() || !description.trim()) {
      showToast("Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }
    showToast("Đề thi đã được lưu và gửi chờ duyệt trước khi xuất bản.");
  }

  function addFiles(fileList) {
    if (!fileList?.length) return;

    const next = [...attachments];
    Array.from(fileList).forEach((file, index) => {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "file";
      next.push({
        id: `upload-${Date.now()}-${index}`,
        name: file.name,
        sizeLabel: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: ext === "pdf" ? "pdf" : "zip",
        status: "uploading",
        progress: 10,
      });
    });
    setAttachments(next);
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

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to="/home">Trang chủ</Link>
        <FontAwesomeIcon icon={faChevronRight} className={styles.chevron} />
        <span>Đóng góp</span>
        <FontAwesomeIcon icon={faChevronRight} className={styles.chevron} />
        <span className={styles.current}>Thêm đề thực hành</span>
      </nav>

      <div className={styles["page-header"]}>
        <h1 className={styles.title}>Thêm đề thi thực hành</h1>
        <div className={styles.actions}>
          <button type="button" className={styles["btn-draft"]} onClick={handleSaveDraft}>
            Lưu nháp
          </button>
          <Button type="button" className={styles["btn-publish"]} onClick={handlePublish}>
            <FontAwesomeIcon icon={faArrowUpFromBracket} />
            Lưu &amp; Xuất bản
          </Button>
        </div>
      </div>

      <section className={styles.card}>
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
            aria-selected={activeTab === "submissions"}
            className={`${styles.tab} ${activeTab === "submissions" ? styles["tab-active"] : ""}`}
            onClick={() => setActiveTab("submissions")}
          >
            Danh sách nộp bài
            <span className={styles.badge}>{submissions.length}</span>
          </button>
          <Link to="/moderator/practice-submissions" className={styles["tab-link"]}>
            Mở trang chấm bài →
          </Link>
        </div>

        {activeTab === "create" ? (
          <form className={styles.form} onSubmit={handlePublish}>
            <div className={styles.columns}>
              <div className={styles["col-left"]}>
                <div className={styles.row}>
                  <label className={styles.field}>
                    <span className={styles.label}>
                      Môn học <span className={styles.required}>*</span>
                    </span>
                    <select
                      className={styles.select}
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      required
                    >
                      <option value="">Chọn môn học</option>
                      {PRACTICE_SUBJECT_OPTIONS.map((code) => (
                        <option key={code} value={code}>
                          {code}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.field}>
                    <span className={styles.label}>
                      Học kỳ <span className={styles.required}>*</span>
                    </span>
                    <select
                      className={styles.select}
                      value={semester}
                      onChange={(event) => setSemester(event.target.value)}
                      required
                    >
                      <option value="">Chọn học kỳ</option>
                      {PRACTICE_SEMESTER_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
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
                    placeholder="VD: Đề thi giữa kỳ môn Lập trình Web"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                  />
                </label>

                <div className={styles.field}>
                  <span className={styles.label}>
                    Mô tả &amp; Yêu cầu <span className={styles.required}>*</span>
                  </span>
                  <div className={styles.editor}>
                    <div className={styles.toolbar} aria-label="Định dạng văn bản">
                      <button type="button" className={styles.tool} aria-label="In đậm">
                        <FontAwesomeIcon icon={faBold} />
                      </button>
                      <button type="button" className={styles.tool} aria-label="In nghiêng">
                        <FontAwesomeIcon icon={faItalic} />
                      </button>
                      <button type="button" className={styles.tool} aria-label="Gạch chân">
                        <FontAwesomeIcon icon={faUnderline} />
                      </button>
                      <button type="button" className={styles.tool} aria-label="Danh sách">
                        <FontAwesomeIcon icon={faListUl} />
                      </button>
                      <button type="button" className={styles.tool} aria-label="Danh sách đánh số">
                        <FontAwesomeIcon icon={faListOl} />
                      </button>
                      <button type="button" className={styles.tool} aria-label="Liên kết">
                        <FontAwesomeIcon icon={faLink} />
                      </button>
                      <button type="button" className={styles.tool} aria-label="Mã">
                        <FontAwesomeIcon icon={faCode} />
                      </button>
                    </div>
                    <textarea
                      className={styles.textarea}
                      placeholder="Nhập nội dung mô tả, yêu cầu đề bài, định dạng nộp bài..."
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      rows={10}
                      required
                    />
                  </div>
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
                              ? " • Tải lên xong"
                              : ` • Đang tải... ${file.progress}%`}
                          </p>
                        </div>
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
                      checked={allowDiscussion}
                      onChange={(event) => setAllowDiscussion(event.target.checked)}
                    />
                    <span className={styles["checkbox-box"]} aria-hidden />
                    <span>
                      <span className={styles["checkbox-label"]}>Cho phép thảo luận</span>
                      <span className={styles["checkbox-hint"]}>
                        Sinh viên có thể bình luận dưới đề thi này
                      </span>
                    </span>
                  </label>

                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={pinExam}
                      onChange={(event) => setPinExam(event.target.checked)}
                    />
                    <span className={styles["checkbox-box"]} aria-hidden />
                    <span>
                      <span className={styles["checkbox-label"]}>Ghim đề thi</span>
                      <span className={styles["checkbox-hint"]}>
                        Hiển thị nổi bật trên trang chủ môn học
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className={styles.submissions}>
            <ul className={styles["submission-list"]}>
              {submissions.map((item) => (
                <li key={item.id} className={styles["submission-item"]}>
                  <div>
                    <p className={styles["submission-name"]}>{item.displayName}</p>
                    <p className={styles["submission-meta"]}>
                      @{item.student} · {item.courseCode} ·{" "}
                      {new Date(item.submittedAt).toLocaleString("vi-VN")}
                    </p>
                    <a
                      href={item.githubUrl}
                      className={styles["submission-link"]}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.githubUrl}
                    </a>
                  </div>
                  <span
                    className={`${styles["submission-status"]} ${styles[`status-${item.status}`]}`}
                  >
                    {getSubmissionStatusLabel(item.status)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

export default AddPracticeExamPage;
