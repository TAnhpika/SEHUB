import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCoins,
  faMagnifyingGlass,
  faUserCheck,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import {
  getRemainingTokenGrant,
  MAX_BONUS_TOKEN_BALANCE,
} from "@/features/admin/payments/adminPaymentPolicy";
import payStyles from "@/features/admin/payments/AdminPayments.module.css";

/**
 * @param {{
 *   open: boolean;
 *   students: Array<{
 *     username: string;
 *     bonusTokens: number;
 *     payosOrderId: string;
 *     planLabel: string;
 *     amountLabel: string;
 *     paymentStatusLabel: string;
 *   }>;
 *   onClose: () => void;
 *   onSubmit: (payload: { username: string; amount: string; reason: string }) => void;
 *   error?: string;
 * }} props
 */
function AdminManualTokenModal({ open, students, onClose, onSubmit, error = "" }) {
  const [query, setQuery] = useState("");
  const [selectedUsername, setSelectedUsername] = useState("");
  const [amount, setAmount] = useState("100");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelectedUsername(students[0]?.username ?? "");
    setAmount("100");
    setReason("");
  }, [open, students]);

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.username.toLowerCase().includes(q) ||
        s.payosOrderId.toLowerCase().includes(q),
    );
  }, [students, query]);

  const selected = students.find((s) => s.username === selectedUsername) ?? null;
  const grantRemaining = selected ? getRemainingTokenGrant(selected.bonusTokens) : 0;
  const canSubmit =
    Boolean(selected) &&
    grantRemaining > 0 &&
    Number(amount) >= 1 &&
    Number(amount) <= grantRemaining &&
    reason.trim().length >= 10;

  if (!open) return null;

  function handleClose() {
    onClose();
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!selected || !canSubmit) return;
    onSubmit({
      username: selected.username,
      amount,
      reason: reason.trim(),
    });
  }

  return (
    <div className={payStyles.modalBackdrop} role="presentation" onClick={handleClose}>
      <div
        className={payStyles.tokenModal}
        role="dialog"
        aria-labelledby="manual-token-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={payStyles.tokenModalHead}>
          <div className={payStyles.tokenModalHeadMain}>
            <span className={payStyles.tokenModalIcon} aria-hidden="true">
              <FontAwesomeIcon icon={faCoins} />
            </span>
            <div>
              <h2 id="manual-token-title" className={payStyles.tokenModalTitle}>
                Cộng token thủ công
              </h2>
              <p className={payStyles.tokenModalSubtitle}>
                Chỉ sinh viên đã chuyển khoản đủ (PayOS webhook OK). Tổng thưởng ≤{" "}
                {MAX_BONUS_TOKEN_BALANCE} token.
              </p>
            </div>
          </div>
          <button
            type="button"
            className={payStyles.modalClose}
            onClick={handleClose}
            aria-label="Đóng"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>

        <form className={payStyles.tokenModalBody} onSubmit={handleSubmit}>
          <div className={payStyles.studentSearch}>
            <FontAwesomeIcon icon={faMagnifyingGlass} className={payStyles.searchIcon} />
            <input
              type="search"
              className={payStyles.studentSearchInput}
              placeholder="Tìm @username hoặc mã PayOS…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Tìm sinh viên đã thanh toán"
            />
            <span className={payStyles.studentCount}>
              {filteredStudents.length} SV đã CK đủ
            </span>
          </div>

          <div className={payStyles.studentList} role="listbox" aria-label="Sinh viên đã thanh toán">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => {
                const remaining = getRemainingTokenGrant(student.bonusTokens);
                const isSelected = student.username === selectedUsername;
                const isFull = remaining === 0;

                return (
                  <button
                    key={student.username}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`${payStyles.studentCard} ${
                      isSelected ? payStyles.studentCardSelected : ""
                    } ${isFull ? payStyles.studentCardDisabled : ""}`}
                    onClick={() => !isFull && setSelectedUsername(student.username)}
                    disabled={isFull}
                  >
                    <span className={payStyles.studentCardIcon} aria-hidden="true">
                      <FontAwesomeIcon icon={faUserCheck} />
                    </span>
                    <span className={payStyles.studentCardMain}>
                      <span className={payStyles.studentCardName}>@{student.username}</span>
                      <span className={payStyles.studentCardMeta}>
                        {student.payosOrderId} · {student.planLabel} · {student.amountLabel}
                      </span>
                      <span className={payStyles.studentCardStatus}>
                        {student.paymentStatusLabel}
                      </span>
                    </span>
                    <span className={payStyles.studentCardTokens}>
                      <strong>
                        {student.bonusTokens}/{MAX_BONUS_TOKEN_BALANCE}
                      </strong>
                      <span>
                        {isFull ? "Đã đủ" : `+${remaining} còn lại`}
                      </span>
                    </span>
                  </button>
                );
              })
            ) : (
              <p className={payStyles.studentEmpty}>
                Không có sinh viên đã chuyển khoản đủ phù hợp tìm kiếm.
              </p>
            )}
          </div>

          {selected ? (
            <div className={payStyles.grantFields}>
              <div className={payStyles.grantRow}>
                <label className={payStyles.grantField}>
                  <span className={payStyles.grantLabel}>
                    Số token cộng thêm
                    {grantRemaining > 0 ? ` (tối đa ${grantRemaining})` : ""}
                  </span>
                  <input
                    className={payStyles.grantInput}
                    type="number"
                    min={1}
                    max={grantRemaining}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={grantRemaining === 0}
                    required
                  />
                </label>
                <div className={payStyles.grantSummary}>
                  <span>Sau khi cộng</span>
                  <strong>
                    {Math.min(
                      MAX_BONUS_TOKEN_BALANCE,
                      selected.bonusTokens + (Number(amount) || 0),
                    )}
                    /{MAX_BONUS_TOKEN_BALANCE}
                  </strong>
                </div>
              </div>
              <label className={payStyles.grantField}>
                <span className={payStyles.grantLabel}>
                  Lý do (audit — tối thiểu 10 ký tự)
                </span>
                <textarea
                  className={payStyles.grantTextarea}
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="VD: Khuyến mãi sự kiện SEHub — tháng 6/2026"
                  required
                />
              </label>
            </div>
          ) : null}

          {error ? <p className={payStyles.hintError}>{error}</p> : null}

          <footer className={payStyles.tokenModalFooter}>
            <Button type="button" look="outline" onClick={handleClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              Ghi nhận cộng token
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default AdminManualTokenModal;
