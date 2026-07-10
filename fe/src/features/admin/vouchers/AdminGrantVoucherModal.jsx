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
import payStyles from "@/features/admin/payments/AdminPayments.module.css";
import voucherStyles from "@/features/admin/vouchers/AdminVouchers.module.css";

/**
 * @param {{
 *   open: boolean;
 *   mode?: 'rank' | 'partner';
 *   students: Array<{
 *     id: string;
 *     username: string;
 *     displayName: string;
 *     plan: string;
 *     status: string;
 *   }>;
 *   levels?: Array<{ id: string, name: string, voucherPercent?: number | null }>;
 *   partnerTypes?: Array<{ code: string, label: string, discountPercent: number }>;
 *   onClose: () => void;
 *   onSubmit: (payload: object) => void;
 *   error?: string;
 * }} props
 */
function AdminGrantVoucherModal({
  open,
  mode = "rank",
  students,
  levels = [],
  partnerTypes = [],
  onClose,
  onSubmit,
  error = "",
}) {
  const [query, setQuery] = useState("");
  const [selectedUsername, setSelectedUsername] = useState("");
  const [levelId, setLevelId] = useState("");
  const [discountPercent, setDiscountPercent] = useState(10);
  const [expiryDays, setExpiryDays] = useState(30);
  const [typeCode, setTypeCode] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelectedUsername(students[0]?.username ?? "");
    setLevelId(levels[0]?.id ?? "");
    setDiscountPercent(levels[0]?.voucherPercent ?? 10);
    setExpiryDays(30);
    setTypeCode(partnerTypes[0]?.code ?? "ftes_20");
    setReason("");
  }, [open, students, levels, partnerTypes]);

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

  const canSubmit =
    Boolean(selected) &&
    selected.status !== "banned" &&
    reason.trim().length >= 10 &&
    (mode === "partner"
      ? Boolean(typeCode)
      : Boolean(levelId) && discountPercent >= 1 && discountPercent <= 100 && expiryDays >= 1);

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

    if (mode === "partner") {
      onSubmit({
        username: selected.username,
        userId: selected.id,
        typeCode,
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
              {mode === "partner" ? "Cấp bù mã FTES" : "Cấp voucher rank"}
            </h2>
            <p className={payStyles.tokenModalSubtitle}>
              {mode === "partner"
                ? "Lấy 1 mã Available từ kho đã import — gắn vào tài khoản SV."
                : "Giảm % khi checkout Premium SEHUB theo level Gamification."}
            </p>
          </div>
        </div>
        <button type="button" className={payStyles.modalClose} onClick={onClose} aria-label="Đóng">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </header>

      <form className={payStyles.tokenModalBody} onSubmit={handleSubmit}>
        {mode === "partner" ? (
          <label className={voucherStyles.templateField}>
            <span className={payStyles.grantLabel}>Loại FTES</span>
            <select
              className={voucherStyles.templateSelect}
              value={typeCode}
              onChange={(event) => setTypeCode(event.target.value)}
            >
              {partnerTypes.map((type) => (
                <option key={type.code} value={type.code}>
                  {type.label} (−{type.discountPercent}%)
                </option>
              ))}
            </select>
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
            <div className={voucherStyles.grantRow}>
              <label className={voucherStyles.templateField}>
                <span className={payStyles.grantLabel}>% giảm</span>
                <input
                  className={voucherStyles.templateSelect}
                  type="number"
                  min={1}
                  max={100}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                />
              </label>
              <label className={voucherStyles.templateField}>
                <span className={payStyles.grantLabel}>Hiệu lực (ngày)</span>
                <input
                  className={voucherStyles.templateSelect}
                  type="number"
                  min={1}
                  max={365}
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(Number(e.target.value))}
                />
              </label>
            </div>
          </>
        )}

        <label className={voucherStyles.templateField}>
          <span className={payStyles.grantLabel}>Tìm sinh viên</span>
          <div className={voucherStyles.searchBox}>
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="@username hoặc tên…"
            />
          </div>
        </label>

        <div className={voucherStyles.studentList} role="listbox">
          {filteredStudents.map((student) => (
            <button
              key={student.id}
              type="button"
              role="option"
              aria-selected={selectedUsername === student.username}
              className={[
                voucherStyles.studentOption,
                selectedUsername === student.username ? voucherStyles.studentOptionActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setSelectedUsername(student.username)}
            >
              <span className={voucherStyles.studentAvatar}>
                <FontAwesomeIcon icon={faUserGraduate} />
              </span>
              <span>
                <strong>@{student.username}</strong>
                <span className={voucherStyles.studentMeta}>
                  {student.displayName} · {student.plan}
                </span>
              </span>
            </button>
          ))}
        </div>

        <label className={voucherStyles.templateField}>
          <span className={payStyles.grantLabel}>Lý do (≥ 10 ký tự)</span>
          <textarea
            className={voucherStyles.importTextarea}
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: Cấp bù sau khi kho hết mã lúc thanh toán…"
          />
        </label>

        {error ? (
          <p className={voucherStyles.formError} role="alert">
            {error}
          </p>
        ) : null}

        <div className={payStyles.tokenModalActions}>
          <Button look="outline" type="button" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {mode === "partner" ? "Gán mã FTES" : "Cấp voucher rank"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default AdminGrantVoucherModal;
