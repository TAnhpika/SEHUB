import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileImport, faXmark } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { Modal } from "@/common/Modal/Modal";
import backdropStyles from "@/common/styles/modalBackdrop.module.css";
import payStyles from "@/features/admin/payments/AdminPayments.module.css";
import voucherStyles from "@/features/admin/vouchers/AdminVouchers.module.css";

/**
 * @param {{
 *   open: boolean;
 *   types: Array<{ code: string, label: string, discountPercent: number }>;
 *   onClose: () => void;
 *   onSubmit: (payload: { typeCode: string, codes: string[] }) => Promise<void> | void;
 *   error?: string;
 *   submitting?: boolean;
 * }} props
 */
function ImportPartnerVoucherModal({
  open,
  types = [],
  onClose,
  onSubmit,
  error = "",
  submitting = false,
}) {
  const [typeCode, setTypeCode] = useState("");
  const [rawText, setRawText] = useState("");

  useEffect(() => {
    if (!open) return;
    setTypeCode(types[0]?.code ?? "ftes_20");
    setRawText("");
  }, [open, types]);

  const parsedCodes = useMemo(() => {
    const lines = rawText
      .split(/[\n,;]+/)
      .map((line) => line.trim())
      .filter(Boolean);
    const unique = [];
    const seen = new Set();
    for (const code of lines) {
      const key = code.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(code);
    }
    return unique;
  }, [rawText]);

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const withoutHeader = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line, index) => !(index === 0 && /^code$/i.test(line.split(/[,;]/)[0])));
      setRawText(withoutHeader.join("\n"));
    };
    reader.readAsText(file);
    event.target.value = "";
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
            <FontAwesomeIcon icon={faFileImport} />
          </span>
          <div>
            <h2 className={payStyles.tokenModalTitle}>Import mã FTES</h2>
            <p className={payStyles.tokenModalSubtitle}>
              Dán mã partner thật (1 mã/dòng) hoặc tải CSV. Không sinh mã trong SEHUB.
            </p>
          </div>
        </div>
        <button type="button" className={payStyles.modalClose} onClick={onClose} aria-label="Đóng">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </header>

      <div className={payStyles.tokenModalBody}>
        <label className={voucherStyles.templateField}>
          <span className={payStyles.grantLabel}>Loại voucher</span>
          <select
            className={voucherStyles.templateSelect}
            value={typeCode}
            onChange={(e) => setTypeCode(e.target.value)}
          >
            {types.map((type) => (
              <option key={type.code} value={type.code}>
                {type.label} (−{type.discountPercent}%)
              </option>
            ))}
          </select>
        </label>

        <label className={voucherStyles.templateField}>
          <span className={payStyles.grantLabel}>Danh sách mã</span>
          <textarea
            className={voucherStyles.importTextarea}
            rows={10}
            placeholder={"FTES-ABC-001\nFTES-ABC-002"}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
        </label>

        <label className={voucherStyles.filePick}>
          <span>Hoặc chọn file .csv / .txt</span>
          <input type="file" accept=".csv,.txt,text/plain,text/csv" onChange={handleFileChange} />
        </label>

        <p className={voucherStyles.importPreview}>
          Sẽ import <strong>{parsedCodes.length}</strong> mã (đã loại trùng trong lô).
        </p>

        {error ? (
          <p className={voucherStyles.formError} role="alert">
            {error}
          </p>
        ) : null}

        <div className={payStyles.tokenModalActions}>
          <Button look="outline" type="button" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button
            type="button"
            disabled={submitting || !typeCode || parsedCodes.length === 0}
            onClick={() => onSubmit({ typeCode, codes: parsedCodes })}
          >
            {submitting ? "Đang import…" : "Import vào kho"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ImportPartnerVoucherModal;
