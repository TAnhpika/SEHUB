import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faFileArrowUp, faXmark } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { useAuth } from "@/context";
import { useToast } from "@/common/Toast/ToastProvider";
import { getRefundForm, submitRefundBankDetails } from "@/api/premiumApi";
import { formatVnd } from "@/features/landing/PricingModal/pricingData";
import {
  formatFileSize,
  MAX_REFUND_PROOF_FILE_SIZE,
  MAX_REFUND_PROOF_FILES,
  REFUND_PROOF_FILE_TYPES,
} from "@/features/premium/PremiumRefundFormPage/refundFormData";
import styles from "@/features/feedback/FeedbackPage/FeedbackPage.module.css";

/**
 * @fileoverview Trang form thông tin ngân hàng nhận hoàn tiền Premium sau khi admin duyệt.
 *
 * Truy cập qua query `?order=<orderCode>`. Yêu cầu upload ảnh chứng từ chuyển khoản.
 *
 * @module features/premium/PremiumRefundFormPage
 */

/**
 * Trang điền thông tin tài khoản ngân hàng nhận hoàn tiền Premium.
 *
 * **Luồng:**
 * 1. Đọc `order` từ query → `getRefundForm(orderCode)`.
 * 2. Nếu `bankDetailsSubmitted` → hiển thị thông báo đã gửi.
 * 3. Ngược lại → form username, ngân hàng, STK, ảnh CK → `submitRefundBankDetails`.
 *
 * @returns {import('react').ReactElement} Trang form hoặc redirect/loading state.
 *
 * @example
 * // Route: /home/premium/refund?order=ORD-123
 * <Route path="/home/premium/refund" element={<PremiumRefundFormPage />} />
 */
function PremiumRefundFormPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [searchParams] = useSearchParams();
  const orderCode = searchParams.get("order")?.trim() ?? "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formContext, setFormContext] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [username, setUsername] = useState(user?.username ?? "");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState("");

  useEffect(() => {
    if (!orderCode) {
      setLoading(false);
      setError("Không tìm thấy mã đơn hoàn tiền.");
      return undefined;
    }

    let cancelled = false;

    getRefundForm(orderCode)
      .then((dto) => {
        if (!cancelled) {
          setFormContext(dto);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message ?? "Không tải được thông tin hoàn tiền.");
          setFormContext(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [orderCode]);

  function handleClearForm() {
    setUsername(user?.username ?? "");
    setBankName("");
    setAccountNumber("");
    setAccountName("");
    setNote("");
    setFiles([]);
    setFileError("");
  }

  function handleAddFiles(event) {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (selectedFiles.length === 0) return;

    setFileError("");

    const nextFiles = [...files];
    for (const file of selectedFiles) {
      if (nextFiles.length >= MAX_REFUND_PROOF_FILES) {
        setFileError(`Chỉ được tải tối đa ${MAX_REFUND_PROOF_FILES} ảnh.`);
        break;
      }

      if (file.size > MAX_REFUND_PROOF_FILE_SIZE) {
        setFileError(`Ảnh "${file.name}" vượt quá 10 MB.`);
        continue;
      }

      const isDuplicate = nextFiles.some(
        (item) => item.name === file.name && item.size === file.size,
      );
      if (!isDuplicate) {
        nextFiles.push(file);
      }
    }

    setFiles(nextFiles);
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    setFileError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!username.trim()) {
      showToast("Vui lòng nhập username SEHUB của bạn.");
      return;
    }

    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      showToast("Vui lòng điền đầy đủ thông tin tài khoản nhận tiền.");
      return;
    }

    if (files.length === 0) {
      showToast("Vui lòng tải ít nhất một ảnh đã chuyển khoản.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitRefundBankDetails({
        orderCode,
        username: username.trim(),
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
        note: note.trim() || null,
        files,
      });

      showToast(result?.message ?? "Đã gửi thông tin nhận tiền.");
      const refreshed = await getRefundForm(orderCode);
      setFormContext(refreshed);
      handleClearForm();
    } catch (err) {
      showToast(err?.message ?? "Không gửi được thông tin nhận tiền.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!orderCode) {
    return <Navigate to="/home/premium" replace />;
  }

  if (loading) {
    return <div className={styles.page}>Đang tải thông tin hoàn tiền...</div>;
  }

  if (error && !formContext) {
    return (
      <div className={styles.page}>
        <Link to="/home/premium" className={styles.back}>
          <FontAwesomeIcon icon={faArrowLeft} />
          Quay lại
        </Link>
        <p>{error}</p>
      </div>
    );
  }

  const alreadySubmitted = Boolean(formContext?.bankDetailsSubmitted);

  return (
    <div className={styles.page}>
      <Link to="/home/premium" className={styles.back}>
        <FontAwesomeIcon icon={faArrowLeft} />
        Quay lại
      </Link>

      <header className={styles.header}>
        <h1 className={styles.title}>Thông tin nhận hoàn tiền Premium</h1>
        <p className={styles.subtitle}>
          Admin đã duyệt yêu cầu hoàn tiền của bạn. Vui lòng điền thông tin tài khoản ngân hàng để
          SEHub xử lý chuyển khoản.
        </p>
        <div className={styles.account}>
          <p>
            Đang đăng nhập với <strong>{user?.email}</strong>
          </p>
          <p>
            Mã đơn: <strong>{formContext?.orderCode}</strong>
            {formContext?.planName ? (
              <>
                {" "}
                · Gói <strong>{formContext.planName}</strong>
              </>
            ) : null}
            {typeof formContext?.amount === "number" ? (
              <>
                {" "}
                · Số tiền <strong>{formatVnd(formContext.amount)}</strong>
              </>
            ) : null}
          </p>
          {formContext?.message ? <p className={styles.note}>{formContext.message}</p> : null}
        </div>
      </header>

      {alreadySubmitted ? (
        <section className={styles.card}>
          <p>
            Bạn đã gửi thông tin nhận tiền cho đơn này. SEHub sẽ liên hệ nếu cần bổ sung thêm.
          </p>
        </section>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          <section className={styles.card}>
            <label className={styles.field} htmlFor="refund-username">
              <span className={styles.label}>
                Username SEHUB của bạn là ?
                <span className={styles.required} aria-hidden="true">
                  *
                </span>
              </span>
              <input
                id="refund-username"
                type="text"
                className={styles.input}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Câu trả lời của bạn"
                required
                disabled={submitting}
              />
            </label>
          </section>

          <section className={styles.card}>
            <label className={styles.field} htmlFor="refund-bank">
              <span className={styles.label}>
                Tên ngân hàng
                <span className={styles.required} aria-hidden="true">
                  *
                </span>
              </span>
              <input
                id="refund-bank"
                type="text"
                className={styles.input}
                value={bankName}
                onChange={(event) => setBankName(event.target.value)}
                placeholder="VD: MB Bank"
                required
                disabled={submitting}
              />
            </label>
          </section>

          <section className={styles.card}>
            <label className={styles.field} htmlFor="refund-account-number">
              <span className={styles.label}>
                Số tài khoản
                <span className={styles.required} aria-hidden="true">
                  *
                </span>
              </span>
              <input
                id="refund-account-number"
                type="text"
                className={styles.input}
                value={accountNumber}
                onChange={(event) => setAccountNumber(event.target.value)}
                placeholder="Câu trả lời của bạn"
                required
                disabled={submitting}
              />
            </label>
          </section>

          <section className={styles.card}>
            <label className={styles.field} htmlFor="refund-account-name">
              <span className={styles.label}>
                Tên tài khoản
                <span className={styles.required} aria-hidden="true">
                  *
                </span>
              </span>
              <input
                id="refund-account-name"
                type="text"
                className={styles.input}
                value={accountName}
                onChange={(event) => setAccountName(event.target.value)}
                placeholder="Câu trả lời của bạn"
                required
                disabled={submitting}
              />
            </label>
          </section>

          <section className={styles.card}>
            <div className={styles.field}>
              <span className={styles.label}>
                Ảnh đã chuyển khoản
                <span className={styles.required} aria-hidden="true">
                  *
                </span>
              </span>
              <p className={styles.hint}>
                Tải tối đa {MAX_REFUND_PROOF_FILES} ảnh. Mỗi ảnh có kích thước tối đa 10 MB (JPEG,
                PNG, WEBP, GIF).
              </p>

              <input
                ref={fileInputRef}
                type="file"
                className={styles["file-input"]}
                accept={REFUND_PROOF_FILE_TYPES}
                multiple
                onChange={handleAddFiles}
                disabled={submitting}
              />

              <button
                type="button"
                className={styles["upload-btn"]}
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
              >
                <FontAwesomeIcon icon={faFileArrowUp} />
                Thêm ảnh
              </button>

              {fileError ? <p className={styles["file-error"]}>{fileError}</p> : null}

              {files.length > 0 ? (
                <ul className={styles["file-list"]}>
                  {files.map((file, index) => (
                    <li key={`${file.name}-${file.size}-${index}`} className={styles["file-item"]}>
                      <div className={styles["file-meta"]}>
                        <span className={styles["file-name"]}>{file.name}</span>
                        <span className={styles["file-size"]}>{formatFileSize(file.size)}</span>
                      </div>
                      <button
                        type="button"
                        className={styles["file-remove"]}
                        onClick={() => removeFile(index)}
                        aria-label={`Xóa ảnh ${file.name}`}
                        disabled={submitting}
                      >
                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>

          <section className={styles.card}>
            <label className={styles.field} htmlFor="refund-note">
              <span className={styles.label}>Ghi chú thêm</span>
              <input
                id="refund-note"
                type="text"
                className={styles.input}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Câu trả lời của bạn"
                disabled={submitting}
              />
            </label>
          </section>

          <div className={styles.actions}>
            <Button type="submit" className={styles.submit} disabled={submitting}>
              {submitting ? "Đang gửi..." : "Gửi"}
            </Button>
            <button
              type="button"
              className={styles.clear}
              onClick={handleClearForm}
              disabled={submitting}
            >
              Xóa hết câu trả lời
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default PremiumRefundFormPage;
