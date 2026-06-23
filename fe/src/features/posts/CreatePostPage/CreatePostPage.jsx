import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCircleInfo,
  faPaperPlane,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import RichTextEditor from "@/common/RichTextEditor/RichTextEditor";
import RichTextPreview from "@/common/RichTextEditor/RichTextPreview";
import { useToast } from "@/common/Toast/ToastProvider";
import { useAuth } from "@/context";
import { withPremiumUsernameClass } from "@/utils/premiumNameClass";
import * as postsApi from "@/api/postsApi";
import { submitPost } from "@/features/feed/feedData";
import { MAJORS, MAX_CONTENT_LENGTH, SEMESTERS } from "@/features/posts/createPostData";
import { getPlainTextLength } from "@/common/RichTextEditor/richTextEditorWysiwyg";
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
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [anonymous, setAnonymous] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = useCallback(async (file) => {
    const result = await postsApi.uploadPostContentImage(file);
    return result?.url ?? result?.Url ?? null;
  }, []);

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

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim() || getPlainTextLength(content) === 0 || isSubmitting) return;

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
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Viết nội dung bài viết của bạn tại đây..."
              variant="full"
              maxLength={MAX_CONTENT_LENGTH}
              showCounter
              rows={12}
              required
              toolbarAriaLabel="Định dạng nội dung"
              onImageUpload={handleImageUpload}
              onImageUploadError={(message) => showToast(message)}
            />
          ) : (
            <div className={styles.preview}>
              <RichTextPreview value={content} />
            </div>
          )}
          <p className={styles.hint}>
            Dùng nút hình ảnh trên thanh công cụ để chèn ảnh vào nội dung (lưu trên Cloudinary).
          </p>
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
          <Button type="submit" disabled={isSubmitting || !title.trim() || getPlainTextLength(content) === 0}>
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
