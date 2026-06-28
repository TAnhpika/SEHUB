import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faTicket,
  faUserGraduate,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { Modal } from "@/common/Modal/Modal";
import backdropStyles from "@/common/styles/modalBackdrop.module.css";
import { VOUCHER_TEMPLATES } from "@/features/admin/vouchers/adminVoucherPolicy";
import payStyles from "@/features/admin/payments/AdminPayments.module.css";
import voucherStyles from "@/features/admin/vouchers/AdminVouchers.module.css";
import styles from "@/features/admin/shared/adminPage.module.css";

/**
 * @param {{
 *   open: boolean;
 *   useMock?: boolean;
 *   students: Array<{
 *     id: string;
 *     username: string;
 *     displayName: string;
 *     plan: string;
 *     status: string;
 *     activeVouchers: number;
 *   }>;
 *   levels?: Array<{ id: string, name: string, voucherPercent?: number | null }>;
 *   onClose: () => void;
 *   onSubmit: (payload: object) => void;
 *   error?: string;
 * }} props
 */
function AdminGrantVoucherModal({
  open,
  students,
  levels = [],
  useMock = true,
  onClose,
  onSubmit,
  error = "",
}) {
  const [query, setQuery] = useState("");
  const [selectedUsername, setSelectedUsername] = useState("");
  const [templateId, setTemplateId] = useState(VOUCHER_TEMPLATES[0]?.id ?? "");
  const [levelId, setLevelId] = useState("");
  const [discountPercent, setDiscountPercent] = useState(10);
  const [expiryDays, setExpiryDays] = useState(30);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelectedUsername(students[0]?.username ?? "");
    setTemplateId(VOUCHER_TEMPLATES[0]?.id ?? "");
    setLevelId(levels[0]?.id ?? "");
    setDiscountPercent(levels[0]?.voucherPercent ?? 10);
    setExpiryDays(30);
    setReason("");
  }, [open, students, levels]);

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
  const selectedLevel = levels.find((level) => level.id === levelId) ?? null;

  const canSubmit = useMock
    ? Boolean(selected) &&
      selected.status !== "banned" &&
      Boolean(selectedTemplate) &&
      reason.trim().length >= 10
    : Boolean(selected) &&
      selected.status !== "banned" &&
      Boolean(levelId) &&
      discountPercent >= 1 &&
      discountPercent <= 100 &&
      expiryDays >= 1 &&
      reason.trim().length >= 10;

  if (!open) return null;

  function handleLevelChange(nextLevelId) {
    setLevelId(nextLevelId);
    const level = levels.find((item) => item.id === nextLevelId);
    if (level?.voucherPercent) {
      setDiscountPercent(level.voucherPercent);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit || !selected) return;

    if (useMock) {
      if (!selectedTemplate) return;
      onSubmit({
        username: selected.username,
        templateId: selectedTemplate.id,
        reason: reason.trim(),
      });
      return;
    }

    onSubmit({
      username: selected.username,
      levelId,
      discountPercent,
      expiryDays,
      reason: reason.trim(),
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      className={backdropStyles.overlay}
      panelClassName={`${payStyles.tokenModal} ${voucherStyles.grantModal}`}
      closeOnOverlay
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
                Gắn voucher rank vào tài khoản SV — họ sẽ thấy trong &quot;Voucher của tôi&quot;.
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
          {useMock ? (
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
          ) : (
            <>
              <label className={voucherStyles.templateField}>
                <span className={payStyles.grantLabel}>Level thưởng</span>
                <select
                  className={voucherStyles.templateSelect}
                  value={levelId}
                  onChange={(event) => handleLevelChange(event.target.value)}
                >
                  {levels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                      {level.voucherPercent ? ` · −${level.voucherPercent}%` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <div className={voucherStyles.filters}>
                <label className={voucherStyles.filterField}>
                  <span className={payStyles.grantLabel}>Giảm giá (%)</span>
                  <input
                    className={styles.input}
                    type="number"
                    min={1}
                    max={100}
                    value={discountPercent}
                    onChange={(event) => setDiscountPercent(Number(event.target.value))}
                  />
                </label>
                <label className={voucherStyles.filterField}>
                  <span className={payStyles.grantLabel}>Hiệu lực (ngày)</span>
                  <input
                    className={styles.input}
                    type="number"
                    min={1}
                    max={365}
                    value={expiryDays}
                    onChange={(event) => setExpiryDays(Number(event.target.value))}
                  />
                </label>
              </div>
            </>
          )}

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
                          {isBanned
                            ? "Đã khóa — không cấp được"
                            : `${student.activeVouchers} voucher đang hiệu lực`}
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

          {selected && (useMock ? selectedTemplate : selectedLevel) ? (
            <div className={voucherStyles.previewBox}>
              <p className={voucherStyles.previewTitle}>SV sẽ nhận</p>
              <p className={voucherStyles.previewMain}>
                {useMock ? (
                  <>
                    <strong>{selectedTemplate.label}</strong> — {selectedTemplate.discountLabel}
                  </>
                ) : (
                  <>
                    <strong>{selectedLevel.name}</strong> — giảm {discountPercent}% · {expiryDays} ngày
                  </>
                )}
              </p>
              <p className={voucherStyles.previewMeta}>
                @{selected.username} · Hiển thị tại Premium / Voucher của tôi
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
              placeholder="VD: Bù voucher do lỗi kích hoạt PayOS đơn #8821"
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
    </Modal>
  );
}

export default AdminGrantVoucherModal;
