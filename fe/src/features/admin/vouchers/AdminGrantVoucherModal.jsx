import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faTicket,
  faUserGraduate,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { VOUCHER_TEMPLATES } from "@/features/admin/vouchers/adminVoucherPolicy";
import payStyles from "@/features/admin/payments/AdminPayments.module.css";
import voucherStyles from "@/features/admin/vouchers/AdminVouchers.module.css";

/**
 * @param {{
 *   open: boolean;
 *   students: Array<{
 *     id: string;
 *     username: string;
 *     displayName: string;
 *     plan: string;
 *     status: string;
 *     activeVouchers: number;
 *   }>;
 *   onClose: () => void;
 *   onSubmit: (payload: { username: string, templateId: string, reason: string }) => void;
 *   error?: string;
 * }} props
 */
function AdminGrantVoucherModal({ open, students, onClose, onSubmit, error = "" }) {
  const [query, setQuery] = useState("");
  const [selectedUsername, setSelectedUsername] = useState("");
  const [templateId, setTemplateId] = useState(VOUCHER_TEMPLATES[0]?.id ?? "");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelectedUsername(students[0]?.username ?? "");
    setTemplateId(VOUCHER_TEMPLATES[0]?.id ?? "");
    setReason("");
  }, [open, students]);

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (student) =>
        student.username.toLowerCase().includes(q) ||
        student.displayName.toLowerCase().includes(q),
    );
  }, [students, query]);

  const selected = students.find((student) => student.username === selectedUsername) ?? null;
  const selectedTemplate =
    VOUCHER_TEMPLATES.find((template) => template.id === templateId) ?? null;

  const canSubmit =
    Boolean(selected) &&
    selected.status !== "banned" &&
    Boolean(selectedTemplate) &&
    reason.trim().length >= 10;

  if (!open) return null;

  function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit || !selected || !selectedTemplate) return;
    onSubmit({
      username: selected.username,
      templateId: selectedTemplate.id,
      reason: reason.trim(),
    });
  }

  return (
    <div className={payStyles.modalBackdrop} role="presentation" onClick={onClose}>
      <div
        className={`${payStyles.tokenModal} ${voucherStyles.grantModal}`}
        role="dialog"
        aria-labelledby="grant-voucher-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={payStyles.tokenModalHead}>
          <div className={payStyles.tokenModalHeadMain}>
            <span className={`${payStyles.tokenModalIcon} ${voucherStyles.modalIcon}`}>
              <FontAwesomeIcon icon={faTicket} />
            </span>
            <div>
              <h2 id="grant-voucher-title" className={payStyles.tokenModalTitle}>
                Cấp voucher thủ công
              </h2>
              <p className={payStyles.tokenModalSubtitle}>
                Gắn voucher vào tài khoản SV — họ sẽ thấy trong &quot;Voucher của tôi&quot; và
                thông báo in-app.
              </p>
            </div>
          </div>
          <button
            type="button"
            className={payStyles.modalClose}
            onClick={onClose}
            aria-label="Đóng"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>

        <form className={payStyles.tokenModalBody} onSubmit={handleSubmit}>
          <label className={voucherStyles.templateField}>
            <span className={payStyles.grantLabel}>Loại voucher</span>
            <select
              className={voucherStyles.templateSelect}
              value={templateId}
              onChange={(event) => setTemplateId(event.target.value)}
            >
              {VOUCHER_TEMPLATES.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.label} · {template.discountLabel} · {template.validityDays} ngày
                </option>
              ))}
            </select>
            {selectedTemplate ? (
              <p className={voucherStyles.templateHint}>{selectedTemplate.description}</p>
            ) : null}
          </label>

          <section className={voucherStyles.studentPicker}>
            <div className={payStyles.studentSearch}>
              <FontAwesomeIcon icon={faMagnifyingGlass} className={payStyles.searchIcon} />
              <input
                type="search"
                className={payStyles.studentSearchInput}
                placeholder="Tìm @username hoặc tên hiển thị…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Tìm sinh viên"
              />
              <span className={payStyles.studentCount}>{filteredStudents.length} sinh viên</span>
            </div>

            <div
              className={`${payStyles.studentList} ${voucherStyles.studentPickerList}`}
              role="listbox"
              aria-label="Sinh viên"
            >
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => {
                const isSelected = student.username === selectedUsername;
                const isBanned = student.status === "banned";

                return (
                  <button
                    key={student.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`${payStyles.studentCard} ${
                      isSelected ? payStyles.studentCardSelected : ""
                    } ${isBanned ? payStyles.studentCardDisabled : ""}`}
                    onClick={() => !isBanned && setSelectedUsername(student.username)}
                    disabled={isBanned}
                  >
                    <span className={payStyles.studentCardIcon} aria-hidden="true">
                      <FontAwesomeIcon icon={faUserGraduate} />
                    </span>
                    <span className={payStyles.studentCardMain}>
                      <span className={payStyles.studentCardName}>@{student.username}</span>
                      <span className={payStyles.studentCardMeta}>
                        {student.displayName} · Gói {student.plan}
                      </span>
                      <span className={payStyles.studentCardStatus}>
                        {isBanned ? "Đã khóa — không cấp được" : `${student.activeVouchers} voucher đang hiệu lực`}
                      </span>
                    </span>
                  </button>
                );
              })
            ) : (
              <p className={payStyles.studentEmpty}>Không có sinh viên phù hợp.</p>
            )}
            </div>
          </section>

          {selected && selectedTemplate ? (
            <div className={voucherStyles.previewBox}>
              <p className={voucherStyles.previewTitle}>SV sẽ nhận</p>
              <p className={voucherStyles.previewMain}>
                <strong>{selectedTemplate.label}</strong> — {selectedTemplate.discountLabel}
              </p>
              <p className={voucherStyles.previewMeta}>
                @{selected.username} · Hiệu lực {selectedTemplate.validityDays} ngày · Hiển thị tại
                Premium / Voucher của tôi
              </p>
            </div>
          ) : null}

          <label className={payStyles.grantField}>
            <span className={payStyles.grantLabel}>Lý do (audit — tối thiểu 10 ký tự)</span>
            <textarea
              className={payStyles.grantTextarea}
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="VD: Bù voucher FTES do lỗi kích hoạt PayOS đơn #8821"
              required
            />
          </label>

          {error ? <p className={payStyles.hintError}>{error}</p> : null}

          <footer className={payStyles.tokenModalFooter}>
            <Button type="button" look="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              Cấp voucher
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default AdminGrantVoucherModal;
