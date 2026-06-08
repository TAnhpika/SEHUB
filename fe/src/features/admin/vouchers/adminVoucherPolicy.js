/** Nghiệp vụ voucher — giảm Premium & quyền lợi FTES */

export const VOUCHER_STATUS_META = {
  active: { status: "published", label: "Đang hiệu lực" },
  used: { status: "draft", label: "Đã dùng" },
  expired: { status: "pending", label: "Hết hạn" },
  revoked: { status: "rejected", label: "Đã thu hồi" },
};

export const VOUCHER_SOURCE_LABELS = {
  manual: "Admin cấp thủ công",
  payment: "Tự động sau thanh toán",
  rank: "Thưởng rank Gamification",
};

/** @type {Array<{ id: string, label: string, discountLabel: string, partner: string | null, scope: string, validityDays: number, description: string }>} */
export const VOUCHER_TEMPLATES = [
  {
    id: "ftes_20",
    label: "Voucher FTES 20%",
    discountLabel: "Giảm 20%",
    partner: "FTES",
    scope: "Kèm gói Premium 2 học kỳ",
    validityDays: 90,
    description: "SV đổi trên cổng FTES sau khi mua gói 8 tháng.",
  },
  {
    id: "ftes_100",
    label: "Voucher FTES 100%",
    discountLabel: "Miễn phí FTES",
    partner: "FTES",
    scope: "Kèm gói Premium 4 năm",
    validityDays: 365,
    description: "Quyền lợi đối tác khi mua gói toàn khóa.",
  },
  {
    id: "premium_10",
    label: "Giảm 10% Premium",
    discountLabel: "−10%",
    partner: null,
    scope: "Rank Gold",
    validityDays: 30,
    description: "Áp dụng một lần khi thanh toán gói Premium trên SEHUB.",
  },
  {
    id: "premium_20",
    label: "Giảm 20% Premium",
    discountLabel: "−20%",
    partner: null,
    scope: "Rank Platinum",
    validityDays: 30,
    description: "Áp dụng một lần khi thanh toán gói Premium trên SEHUB.",
  },
  {
    id: "promo_event",
    label: "Khuyến mãi sự kiện",
    discountLabel: "−15%",
    partner: null,
    scope: "Admin chỉ định",
    validityDays: 14,
    description: "Voucher bù lỗi / event — chỉ Admin cấp thủ công.",
  },
];

export function getVoucherTemplate(templateId) {
  return VOUCHER_TEMPLATES.find((item) => item.id === templateId) ?? null;
}

export function buildVoucherCode(templateId) {
  const prefix = templateId.replace(/_/g, "-").toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${suffix}`;
}
