export function getPremiumDaysRemaining(expiresAt) {
  if (!expiresAt) return null;
  const end = new Date(expiresAt);
  if (Number.isNaN(end.getTime())) return null;
  const diffMs = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}

export function formatPremiumExpiryDate(expiresAt) {
  if (!expiresAt) return "—";
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatPremiumStatusSummary({ isActive, expiresAt } = {}) {
  if (!isActive) {
    return null;
  }

  const days = getPremiumDaysRemaining(expiresAt);
  const expiryLabel = formatPremiumExpiryDate(expiresAt);

  if (days === null) {
    return "Premium đang hoạt động";
  }

  if (days === 0) {
    return "Premium hết hạn hôm nay";
  }

  return `Premium còn ${days} ngày · hết hạn ${expiryLabel}`;
}

export function isPremiumExpiringSoon(expiresAt, thresholdDays = 7) {
  const days = getPremiumDaysRemaining(expiresAt);
  return days !== null && days > 0 && days <= thresholdDays;
}
