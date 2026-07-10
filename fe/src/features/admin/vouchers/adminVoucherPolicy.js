/** Nghiệp vụ voucher — giảm Premium SEHUB (rank) & nhãn FTES */

export const VOUCHER_STATUS_META = {
  available: { status: "draft", label: "Trong kho" },
  assigned: { status: "published", label: "Đã gán" },
  active: { status: "published", label: "Đang hiệu lực" },
  used: { status: "draft", label: "Đã dùng" },
  expired: { status: "pending", label: "Hết hạn" },
  revoked: { status: "rejected", label: "Đã thu hồi" },
};

export const PARTNER_VOUCHER_TYPE_LABELS = {
  ftes_20: "Voucher FTES 20%",
  ftes_100: "Voucher FTES 100%",
};
