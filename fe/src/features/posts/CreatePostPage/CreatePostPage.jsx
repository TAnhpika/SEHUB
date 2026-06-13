import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAlignLeft,
  faArrowLeft,
  faBold,
  faCircleInfo,
  faCode,
  faImage,
  faItalic,
  faLink,
  faListOl,
  faListUl,
  faMinus,
  faPalette,
  faPaperPlane,
  faQuoteLeft,
  faStrikethrough,
  faTable,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import { withPremiumUsernameClass } from "@/utils/premiumNameClass";
import { submitPost } from "@/features/feed/feedData";
import { MAJORS, MAX_CONTENT_LENGTH, SEMESTERS } from "@/features/posts/createPostData";
import styles from "./CreatePostPage.module.css";

function CreatePostPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, isPremium } = useAuth();

  const [title, setTitle] = useState("");
  const [semester, setSemester] = useState("");
  const [major, setMajor] = useState("");
  const [content, setContent] = useState("");
  const [contentMode, setContentMode] = useState("edit");
  const [coverMode, setCoverMode] = useState("upload");
  const [coverUrl, setCoverUrl] = useState("");
  const [coverFileName, setCoverFileName] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [anonymous, setAnonymous] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function addTag(rawValue) {
    const value = rawValue.trim().replace(/^#/, "");
    if (!value || tags.includes(value)) return;
    setTags((prev) => [...prev, value]);
    setTagInput("");
  }

  function handleTagKeyDown(event) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(tagInput);
    }
  }

  function removeTag(tag) {
    setTags((prev) => prev.filter((item) => item !== tag));
  }

  function handleCoverFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setCoverFileName(file.name);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim() || !content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await submitPost({
        title: title.trim(),
        content: content.trim(),
        tags,
      });
      showToast("Đã gửi bài viết — chờ moderator duyệt trước khi hiển thị.", 5500);
      window.setTimeout(() => navigate("/home"), 1200);
    } catch (err) {
      showToast(err.message ?? "Không đăng được bài viết.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <Link to="/home" className={styles.back}>
        <FontAwesomeIcon icon={faArrowLeft} />
        Quay lại trang chủ
      </Link>

      <header className={styles.header}>
        <h1 className={styles.title}>Tạo bài viết mới</h1>
        <p className={styles.subtitle}>
          Chia sẻ kiến thức của bạn với cộng đồng. Bài viết sẽ được moderator xem xét trước khi
          xuất bản.
        </p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.card}>
          <label className={styles.field}>
            <span className={styles.label}>
              Tiêu đề bài viết <span className={styles.required}>*</span>
            </span>
            <input
              type="text"
              className={styles.input}
              placeholder="Nhập tiêu đề hấp dẫn..."
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>

          <div className={styles.row}>
            <label className={styles.field}>
              <span className={styles.label}>Học kỳ</span>
              <select
                className={styles.select}
                value={semester}
                onChange={(event) => setSemester(event.target.value)}
              >
                <option value="">Chọn học kỳ</option>
                {SEMESTERS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Chuyên ngành</span>
              <select
                className={styles.select}
                value={major}
                onChange={(event) => setMajor(event.target.value)}
              >
                <option value="">Chọn chuyên ngành</option>
                {MAJORS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles["section-head"]}>
            <span className={styles.label}>
              Nội dung <span className={styles.required}>*</span>
            </span>
            <div className={styles.tabs}>
              <button
                type="button"
                className={`${styles.tab} ${contentMode === "edit" ? styles["tab-active"] : ""}`}
                onClick={() => setContentMode("edit")}
              >
                Chỉnh sửa
              </button>
              <button
                type="button"
                className={`${styles.tab} ${contentMode === "preview" ? styles["tab-active"] : ""}`}
                onClick={() => setContentMode("preview")}
              >
                Xem trước
              </button>
            </div>
          </div>

          {contentMode === "edit" ? (
            <div className={styles.editor}>
              <div className={styles.toolbar} aria-label="Định dạng nội dung">
                <button type="button" className={styles.tool} aria-label="Đoạn văn">
                  ¶
                </button>
                <button type="button" className={styles.tool} aria-label="In đậm">
                  <FontAwesomeIcon icon={faBold} />
                </button>
                <button type="button" className={styles.tool} aria-label="In nghiêng">
                  <FontAwesomeIcon icon={faItalic} />
                </button>
                <button type="button" className={styles.tool} aria-label="Gạch ngang">
                  <FontAwesomeIcon icon={faStrikethrough} />
                </button>
                <button type="button" className={styles.tool} aria-label="Màu chữ">
                  <FontAwesomeIcon icon={faPalette} />
                </button>
                <button type="button" className={styles.tool} aria-label="Mã">
                  <FontAwesomeIcon icon={faCode} />
                </button>
                <button type="button" className={styles.tool} aria-label="Liên kết">
                  <FontAwesomeIcon icon={faLink} />
                </button>
                <button type="button" className={styles.tool} aria-label="Hình ảnh">
                  <FontAwesomeIcon icon={faImage} />
                </button>
                <button type="button" className={styles.tool} aria-label="Bảng">
                  <FontAwesomeIcon icon={faTable} />
                </button>
                <button type="button" className={styles.tool} aria-label="Danh sách">
                  <FontAwesomeIcon icon={faListUl} />
                </button>
                <button type="button" className={styles.tool} aria-label="Danh sách đánh số">
                  <FontAwesomeIcon icon={faListOl} />
                </button>
                <button type="button" className={styles.tool} aria-label="Trích dẫn">
                  <FontAwesomeIcon icon={faQuoteLeft} />
                </button>
                <button type="button" className={styles.tool} aria-label="Kẻ ngang">
                  <FontAwesomeIcon icon={faMinus} />
                </button>
                <button type="button" className={styles.tool} aria-label="Căn trái">
                  <FontAwesomeIcon icon={faAlignLeft} />
                </button>
              </div>

              <textarea
                className={styles.textarea}
                placeholder="Viết nội dung bài viết của bạn tại đây..."
                value={content}
                onChange={(event) =>
                  setContent(event.target.value.slice(0, MAX_CONTENT_LENGTH))
                }
                rows={12}
                required
              />

              <p className={styles.counter}>
                {content.length}/{MAX_CONTENT_LENGTH} ký tự
              </p>
            </div>
          ) : (
            <div className={styles.preview}>
              {content.trim() ? (
                <p className={styles["preview-text"]}>{content}</p>
              ) : (
                <p className={styles["preview-empty"]}>Chưa có nội dung để xem trước.</p>
              )}
            </div>
          )}
        </section>

        <section className={styles.card}>
          <p className={styles.label}>Ảnh bìa (tùy chọn)</p>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${coverMode === "upload" ? styles["tab-active"] : ""}`}
              onClick={() => setCoverMode("upload")}
            >
              Upload
            </button>
            <button
              type="button"
              className={`${styles.tab} ${coverMode === "url" ? styles["tab-active"] : ""}`}
              onClick={() => setCoverMode("url")}
            >
              URL
            </button>
          </div>

          {coverMode === "upload" ? (
            <div className={styles.upload}>
              <FontAwesomeIcon icon={faImage} className={styles["upload-icon"]} />
              <label className={styles["upload-btn"]}>
                Chọn ảnh bìa
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif"
                  className={styles["file-input"]}
                  onChange={handleCoverFileChange}
                />
              </label>
              <p className={styles.hint}>PNG, JPG, GIF (tối đa 5MB)</p>
              {coverFileName && <p className={styles["file-name"]}>{coverFileName}</p>}
            </div>
          ) : (
            <input
              type="url"
              className={styles.input}
              placeholder="https://example.com/image.jpg"
              value={coverUrl}
              onChange={(event) => setCoverUrl(event.target.value)}
            />
          )}
        </section>

        <section className={styles.card}>
          <label className={styles.field}>
            <span className={styles.label}>Gắn thẻ (Tags)</span>
            <div className={styles.tags}>
              {tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  #{tag}
                  <button
                    type="button"
                    className={styles["tag-remove"]}
                    aria-label={`Xóa thẻ ${tag}`}
                    onClick={() => removeTag(tag)}
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                className={styles["tag-input"]}
                placeholder="Thêm thẻ (vd: #java, #cs101)..."
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => addTag(tagInput)}
              />
            </div>
          </label>
        </section>

        <section className={styles.card}>
          <div className={styles.setting}>
            <div>
              <p className={styles["setting-title"]}>Đăng ẩn danh</p>
              <p className={styles["setting-desc"]}>
                Tên của bạn sẽ không hiển thị trên bài viết này.
              </p>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(event) => setAnonymous(event.target.checked)}
              />
              <span className={styles.slider} />
            </label>
          </div>

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={allowComments}
              onChange={(event) => setAllowComments(event.target.checked)}
            />
            Cho phép bình luận
          </label>
        </section>

        <div className={styles.notice}>
          <FontAwesomeIcon icon={faCircleInfo} className={styles["notice-icon"]} />
          <div>
            <p className={styles["notice-title"]}>Chờ phê duyệt</p>
            <p className={styles["notice-text"]}>
              Bài viết của bạn sẽ được moderator duyệt trước khi hiển thị trên feed. Bạn sẽ nhận
              được thông báo khi bài viết được duyệt.
            </p>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={() => navigate("/home")}>
            Hủy
          </button>
          <Button type="submit" disabled={isSubmitting || !title.trim() || !content.trim()}>
            Đăng bài
            <FontAwesomeIcon icon={faPaperPlane} />
          </Button>
        </div>

        {!anonymous && user && (
          <p className={styles["author-note"]}>
            Bài viết sẽ được đăng dưới tên{" "}
            <strong className={withPremiumUsernameClass("", isPremium)}>
              {user.displayName}
            </strong>
            .
          </p>
        )}
      </form>
    </div>
  );
}

export default CreatePostPage;
