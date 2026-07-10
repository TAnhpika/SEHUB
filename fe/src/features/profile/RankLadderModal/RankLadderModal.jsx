import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faChevronRight,
  faCircleInfo,
  faGift,
  faTicket,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { Modal } from "@/common/Modal/Modal";
import { getMyPartnerVouchers, getMyVouchers, loadLevelCatalog, mapPartnerVoucherDto, mapRankVoucherDto } from "@/api/gamificationApi";
import { getRankDisplay, getRankIconClass, normalizeRankKey } from "@/utils/rankDisplay";
import rankStyles from "@/utils/rankDisplay.module.css";
import styles from "./RankLadderModal.module.css";

function formatVoucherStatus(status) {
  if (status === "Active" || status === "Assigned") return "Đang dùng được";
  if (status === "Available") return "Trong kho";
  if (status === "Used") return "Đã sử dụng";
  if (status === "Expired") return "Đã hết hạn";
  if (status === "Revoked") return "Đã thu hồi";
  return status;
}

function formatDateVi(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN");
}

function getTierState(tier, points, currentLevelName) {
  const achieved = points >= tier.minPoints;
  const isCurrent = normalizeRankKey(currentLevelName) === normalizeRankKey(tier.name);
  return { achieved, isCurrent };
}

function RankLadderModal({ open, onClose, profile, isOwner = false }) {
  const [levels, setLevels] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [partnerVouchers, setPartnerVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const points = profile?.stats?.points ?? 0;
  const currentRank = getRankDisplay(profile?.level);
  const progressPercent = profile?.nextLevel
    ? Math.min(100, profile.levelProgress ?? 0)
    : 100;

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const mappedLevels = await loadLevelCatalog({ force: true });

        let mappedVouchers = [];
        let mappedPartner = [];
        if (isOwner) {
          try {
            const [voucherDtos, partnerDtos] = await Promise.all([
              getMyVouchers(),
              getMyPartnerVouchers(),
            ]);
            mappedVouchers = (voucherDtos ?? []).map(mapRankVoucherDto);
            mappedPartner = (partnerDtos ?? []).map(mapPartnerVoucherDto);
          } catch {
            mappedVouchers = [];
            mappedPartner = [];
          }
        }

        if (!cancelled) {
          setLevels(mappedLevels);
          setVouchers(mappedVouchers);
          setPartnerVouchers(mappedPartner);
          if (mappedLevels.length === 0) {
            setError("Chưa có cấu hình cấp độ trên hệ thống.");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message ?? "Không tải được bảng cấp độ.");
          setLevels([]);
          setVouchers([]);
          setPartnerVouchers([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [open, isOwner]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cấp độ & phần thưởng"
      panelClassName={styles.panel}
    >
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Thành tích</p>
          <h2 className={styles.title}>Cấp độ & phần thưởng</h2>
        </div>
        <button type="button" className={styles.close} aria-label="Đóng" onClick={onClose}>
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </header>

      <div className={styles.summary}>
        <div className={styles.summaryTop}>
          <span className={`${styles.summaryIcon} ${getRankIconClass(profile?.level, rankStyles)}`}>
            <FontAwesomeIcon icon={currentRank.icon} />
          </span>
          <div className={styles.summaryInfo}>
            <p className={styles.summaryRank}>{currentRank.label}</p>
            <p className={styles.summaryMeta}>{points} điểm</p>
          </div>
        </div>
        <div className={styles.summaryProgress}>
          <div className={styles.summaryProgressHead}>
            <span>
              {profile?.nextLevel ? `Tiến độ lên ${profile.nextLevel}` : "Đã đạt cấp cao nhất"}
            </span>
            {profile?.nextLevel ? (
              <span className={styles.summaryProgressMeta}>Còn {profile.pointsToNext} điểm</span>
            ) : null}
          </div>
          <div className={styles.summaryProgressBar}>
            <span className={styles.summaryProgressFill} style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      {loading ? (
        <p className={styles.status}>Đang tải bảng cấp độ…</p>
      ) : error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : levels.length === 0 ? (
        <p className={styles.status}>Chưa có cấu hình cấp độ.</p>
      ) : (
        <ol className={styles.ladder}>
          {levels.map((tier, index) => {
            const rank = getRankDisplay(tier.name);
            const { achieved, isCurrent } = getTierState(tier, points, profile?.level);
            const isLast = index === levels.length - 1;
            return (
              <li
                key={tier.id}
                className={[
                  styles.tier,
                  achieved && styles.tierAchieved,
                  isCurrent && styles.tierCurrent,
                  !achieved && !isCurrent && styles.tierLocked,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className={styles.tierRail}>
                  <span className={`${styles.tierIcon} ${getRankIconClass(tier.name, rankStyles)}`}>
                    <FontAwesomeIcon icon={rank.icon} />
                  </span>
                  {!isLast ? <span className={styles.tierLine} aria-hidden="true" /> : null}
                </div>

                <div className={styles.tierCard}>
                  <div className={styles.tierHead}>
                    <div>
                      <p className={styles.tierName}>{tier.name}</p>
                      <p className={styles.tierPoints}>Từ {tier.minPoints} điểm</p>
                    </div>
                    {isCurrent ? <span className={styles.tierBadge}>Hiện tại</span> : null}
                    {achieved && !isCurrent ? (
                      <span className={styles.tierBadgeMuted}>
                        <FontAwesomeIcon icon={faCheck} />
                        Đã đạt
                      </span>
                    ) : null}
                  </div>

                  <p className={styles.tierReward}>
                    <FontAwesomeIcon icon={faGift} className={styles.tierRewardIcon} />
                    {tier.voucherLabel
                      ? `Thưởng lên cấp: ${tier.voucherLabel}`
                      : "Không có voucher thưởng"}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {isOwner && !loading && !error && partnerVouchers.length > 0 ? (
        <section className={styles.vouchers}>
          <h3 className={styles.vouchersTitle}>
            <FontAwesomeIcon icon={faTicket} />
            Mã FTES của bạn
          </h3>
          <ul className={styles.voucherList}>
            {partnerVouchers.map((voucher) => (
              <li key={voucher.id} className={styles.voucherItem}>
                <span className={styles.voucherLevel}>{voucher.typeLabel || "FTES"}</span>
                <span className={styles.voucherDiscount}>
                  <code>{voucher.code}</code>
                </span>
                <span className={styles.voucherMeta}>
                  {formatVoucherStatus(voucher.status)} · hết hạn {formatDateVi(voucher.expiresAt)}
                </span>
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(voucher.code);
                      setCopiedId(voucher.id);
                      window.setTimeout(() => setCopiedId(null), 1500);
                    } catch {
                      /* ignore */
                    }
                  }}
                >
                  {copiedId === voucher.id ? "Đã copy" : "Copy mã"}
                </button>
              </li>
            ))}
          </ul>
          <a
            href="https://ftes.vn/vi"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.premiumLink}
            onClick={onClose}
          >
            Đổi mã trên FTES
            <FontAwesomeIcon icon={faChevronRight} />
          </a>
        </section>
      ) : null}

      {isOwner && !loading && !error && vouchers.length > 0 ? (
        <section className={styles.vouchers}>
          <h3 className={styles.vouchersTitle}>
            <FontAwesomeIcon icon={faTicket} />
            Voucher rank (giảm Premium SEHUB)
          </h3>
          <ul className={styles.voucherList}>
            {vouchers.map((voucher) => (
              <li key={voucher.id} className={styles.voucherItem}>
                <span className={styles.voucherLevel}>{voucher.levelName}</span>
                <span className={styles.voucherDiscount}>−{voucher.discountPercent}% Premium</span>
                <span className={styles.voucherMeta}>
                  {formatVoucherStatus(voucher.status)} · hết hạn {formatDateVi(voucher.expiresAt)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className={styles.hint}>
        <FontAwesomeIcon icon={faCircleInfo} />
        Ngưỡng điểm và phần thưởng do hệ thống cấu hình, có thể thay đổi theo thời gian.
      </p>
    </Modal>
  );
}

export default RankLadderModal;
