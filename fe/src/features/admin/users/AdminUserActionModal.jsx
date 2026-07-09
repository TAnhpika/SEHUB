import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCrown,
  faKey,
  faShieldHalved,
  faUnlock,
  faUserShield,
  faUserSlash,
  faXmark,
  faCoins,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { Modal } from "@/common/Modal/Modal";
import backdropStyles from "@/common/styles/modalBackdrop.module.css";
import { ACTION_LOADING } from "@/utils/actionLoadingLabels";
import { PREMIUM_PLANS } from "@/features/admin/payments/adminPaymentPolicy";
import payStyles from "@/features/admin/payments/AdminPayments.module.css";

const MODE_META = {
  ban: {
    title: "Khóa vĩnh viễn",
    subtitle: "Tài khoản không đăng nhập được. Ghi audit bất biến.",
    icon: faUserSlash,
    confirm: "Xác nhận khóa",
    needsReason: true,
  },
  unban: {
    title: "Mở khóa tài khoản",
    subtitle: "Khôi phục trạng thái không bị khóa cho sinh viên.",
    icon: faUnlock,
    confirm: "Mở khóa",
    needsReason: true,
  },
  resetPassword: {
    title: "Reset mật khẩu",
    subtitle: "Gửi email chứa link đặt lại mật khẩu tới hộp thư đã đăng ký.",
    icon: faKey,
    confirm: "Gửi email reset",
    needsReason: false,
  },
  grantPremium: {
    title: "Cấp Premium thủ công",
    subtitle: "Kích hoạt gói Premium không qua PayOS — cần lý do audit.",
    icon: faCrown,
    confirm: "Cấp Premium",
    needsReason: true,
  },
  grantToken: {
    title: "Cộng token AI",
    subtitle: "Cộng token thưởng tích lũy (tối đa 1.000/user).",
    icon: faCoins,
    confirm: "Cộng token",
    needsReason: true,
  },
  grantModerator: {
    title: "Gán Moderator",
    subtitle: "Nâng quyền kiểm duyệt viên — xuất hiện trong Phân quyền Mod.",
    icon: faUserShield,
    confirm: "Gán Mod",
    needsReason: true,
  },
};

/**
 * @param {{
 *   open: boolean;
 *   mode: keyof typeof MODE_META;
 *   user: { id: string, username: string, email: string, displayName: string } | null;
 *   onClose: () => void;
 *   onSubmit: (payload: object) => void;
 *   error?: string;
 *   submitting?: boolean;
 * }} props
 */
function AdminUserActionModal({ open, mode, user, onClose, onSubmit, error = "", submitting = false }) {
  const [reason, setReason] = useState("");
  const [planId, setPlanId] = useState("semester");
  const [amount, setAmount] = useState("100");

  const meta = MODE_META[mode] ?? MODE_META.ban;

  useEffect(() => {
    if (!open) return;
    setReason("");
    setPlanId("semester");
    setAmount("100");
  }, [open, mode, user?.id]);

  if (!open || !user) return null;

  const needsReason = meta.needsReason;
  const canSubmit =
    !submitting &&
    (!needsReason || reason.trim().length >= 10
      ? mode !== "grantToken" || (Number(amount) >= 1 && reason.trim().length >= 10)
      : false);

  const loadingLabelByMode = {
    ban: ACTION_LOADING.ban,
    unban: ACTION_LOADING.unban,
    resetPassword: ACTION_LOADING.submit,
    grantPremium: ACTION_LOADING.submit,
    grantToken: ACTION_LOADING.submit,
    grantModerator: ACTION_LOADING.submit,
  };

  function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    const payload = { reason: reason.trim() };
    if (mode === "grantPremium") payload.planId = planId;
    if (mode === "grantToken") payload.amount = amount;
    onSubmit(payload);
  }

  return (
    <Modal
      open={open}
      onClose={submitting ? undefined : onClose}
      className={backdropStyles.overlay}
      panelClassName={payStyles.tokenModal}
      closeOnOverlay={!submitting}
    >
        <header className={payStyles.tokenModalHead}>
          <div className={payStyles.tokenModalHeadMain}>
            <span className={payStyles.tokenModalIcon}>
              <FontAwesomeIcon icon={meta.icon} />
            </span>
            <div>
              <h2 id="user-action-title" className={payStyles.tokenModalTitle}>
                {meta.title}
              </h2>
              <p className={payStyles.tokenModalSubtitle}>{meta.subtitle}</p>
            </div>
          </div>
          <button type="button" className={payStyles.modalClose} onClick={onClose} disabled={submitting} aria-label="Đóng">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>

        <form className={payStyles.tokenModalBody} onSubmit={handleSubmit}>
          <div className={payStyles.grantSummary} style={{ marginBottom: "0.5rem" }}>
            <span>Tài khoản</span>
            <strong>
              @{user.username} · {user.displayName}
            </strong>
            <span style={{ fontSize: "0.75rem", color: "#434655" }}>{user.email}</span>
          </div>

          {mode === "grantPremium" ? (
            <label className={payStyles.grantField}>
              <span className={payStyles.grantLabel}>Gói Premium</span>
              <select
                className={payStyles.grantInput}
                value={planId}
                onChange={(event) => setPlanId(event.target.value)}
              >
                {PREMIUM_PLANS.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.label} — {plan.durationLabel}
                    {plan.voucher ? ` · ${plan.voucher}` : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {mode === "grantToken" ? (
            <label className={payStyles.grantField}>
              <span className={payStyles.grantLabel}>Số token cộng thêm</span>
              <input
                className={payStyles.grantInput}
                type="number"
                min={1}
                max={1000}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </label>
          ) : null}

          {needsReason ? (
            <label className={payStyles.grantField}>
              <span className={payStyles.grantLabel}>Lý do (audit — tối thiểu 10 ký tự)</span>
              <textarea
                className={payStyles.grantTextarea}
                rows={3}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="VD: Vi phạm spam nhiều lần — khóa theo quyết định Admin"
                required
              />
            </label>
          ) : (
            <p className={payStyles.hint} style={{ margin: 0 }}>
              <FontAwesomeIcon icon={faShieldHalved} /> Hành động được ghi vào nhật ký audit tài
              khoản.
            </p>
          )}

          {error ? <p className={payStyles.hintError}>{error}</p> : null}

          <footer className={payStyles.tokenModalFooter}>
            <Button type="button" look="outline" onClick={onClose} disabled={submitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={!canSubmit} loading={submitting} loadingLabel={loadingLabelByMode[mode] ?? ACTION_LOADING.submit}>
              {meta.confirm}
            </Button>
          </footer>
        </form>
    </Modal>
  );
}

export default AdminUserActionModal;
