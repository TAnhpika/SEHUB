import { useState } from "react";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import styles from "@/features/moderator/shared/moderatorPage.module.css";

function AddFinalExamPage() {
  const { showToast } = useToast();
  const [code, setCode] = useState("MAE101");
  const [title, setTitle] = useState("Cuối kỳ Toán rời rạc — đề mẫu 2025");
  const [questionCount, setQuestionCount] = useState("40");

  function handleSubmit(event) {
    event.preventDefault();
    if (!code.trim() || !title.trim()) {
      showToast("Vui lòng điền mã môn và tiêu đề.");
      return;
    }
    showToast("Đã gửi đề cuối kỳ chờ Admin duyệt (mock).");
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Thêm đề cuối kỳ</h1>
          <p className={styles.subtitle}>
            Upload PDF/ảnh câu hỏi trắc nghiệm — Admin duyệt trước khi public.
          </p>
        </div>
      </header>

      <form className={styles.panel} onSubmit={handleSubmit}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Mã môn</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{ padding: "0.625rem 0.75rem", borderRadius: 8, border: "1px solid #c3c6d7" }}
          />
        </label>
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.375rem",
            marginTop: "1rem",
          }}
        >
          <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Tiêu đề đề thi</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ padding: "0.625rem 0.75rem", borderRadius: 8, border: "1px solid #c3c6d7" }}
          />
        </label>
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.375rem",
            marginTop: "1rem",
          }}
        >
          <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Số câu (ước lượng)</span>
          <input
            type="number"
            value={questionCount}
            onChange={(e) => setQuestionCount(e.target.value)}
            style={{ padding: "0.625rem 0.75rem", borderRadius: 8, border: "1px solid #c3c6d7" }}
          />
        </label>
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.375rem",
            marginTop: "1rem",
          }}
        >
          <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>File đề (PDF)</span>
          <input type="file" accept=".pdf,image/*" />
        </label>
        <div className={styles.actions} style={{ marginTop: "1.25rem" }}>
          <Button type="submit">Gửi chờ duyệt</Button>
          <Button look="outline" type="button" onClick={() => showToast("Đã lưu nháp (mock).")}>
            Lưu nháp
          </Button>
        </div>
      </form>
    </div>
  );
}

export default AddFinalExamPage;
