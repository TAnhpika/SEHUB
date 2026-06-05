/** Nghiệp vụ Gamification — SEHUB_PhanTichNghiepVu.md §3.6 */

export const BADGE_CATEGORIES = [
  { id: "community", label: "Cộng đồng" },
  { id: "learning", label: "Học tập" },
  { id: "exam", label: "Đề thi" },
  { id: "streak", label: "Streak" },
  { id: "social", label: "Tương tác" },
];

export const TRIGGER_TYPES = [
  { id: "post_count", label: "Số bài viết đăng", unit: "bài" },
  { id: "practice_submit_count", label: "Số bài TH đã nộp", unit: "bài" },
  { id: "exam_complete_count", label: "Số đề trắc nghiệm hoàn thành", unit: "đề" },
  { id: "streak_days", label: "Streak liên tiếp", unit: "ngày" },
  { id: "like_received_count", label: "Lượt like nhận được", unit: "like" },
  { id: "comment_count", label: "Số bình luận", unit: "cmt" },
  { id: "follower_count", label: "Số người theo dõi", unit: "follower" },
  { id: "login_days", label: "Ngày đăng nhập tích lũy", unit: "ngày" },
];

export const POINT_RULE_TYPES = [
  { id: "streak_milestone", label: "Mốc streak (định kỳ)" },
  { id: "daily_login", label: "Đăng nhập hàng ngày" },
  { id: "post_published", label: "Đăng bài được duyệt" },
  { id: "exam_passed", label: "Hoàn thành đề (đạt ngưỡng)" },
  { id: "manual", label: "Thủ công / sự kiện" },
];

export const RANK_COLORS = [
  { id: "bronze", label: "Đồng", hex: "#b45309" },
  { id: "silver", label: "Bạc", hex: "#64748b" },
  { id: "gold", label: "Vàng", hex: "#ca8a04" },
  { id: "platinum", label: "Bạch kim", hex: "#7c3aed" },
  { id: "custom", label: "Tùy chỉnh", hex: "#004ac6" },
];

export function slugify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCategoryLabel(id) {
  return BADGE_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function getTriggerLabel(id) {
  return TRIGGER_TYPES.find((t) => t.id === id)?.label ?? id;
}

export function getTriggerUnit(id) {
  return TRIGGER_TYPES.find((t) => t.id === id)?.unit ?? "";
}

export function getPointRuleTypeLabel(id) {
  return POINT_RULE_TYPES.find((t) => t.id === id)?.label ?? id;
}

export function formatTriggerRule(triggerType, triggerValue) {
  const label = getTriggerLabel(triggerType);
  const unit = getTriggerUnit(triggerType);
  return `≥ ${triggerValue} ${unit} — ${label}`;
}

export function validateRankPayload(payload, existingRanks, editingId) {
  const name = payload.name?.trim();
  const slug = slugify(payload.slug || name);
  const minPoints = Number(payload.minPoints);

  if (!name) return { ok: false, message: "Nhập tên cấp hạng." };
  if (!slug) return { ok: false, message: "Slug không hợp lệ." };
  if (Number.isNaN(minPoints) || minPoints < 0) {
    return { ok: false, message: "Ngưỡng điểm phải ≥ 0." };
  }

  const slugTaken = existingRanks.some((r) => r.slug === slug && r.id !== editingId);
  if (slugTaken) return { ok: false, message: `Slug "${slug}" đã tồn tại.` };

  return {
    ok: true,
    data: {
      name,
      slug,
      minPoints,
      sortOrder: Number(payload.sortOrder) || 0,
      colorKey: payload.colorKey || "custom",
      voucherDiscount:
        payload.voucherDiscount === "" || payload.voucherDiscount == null
          ? null
          : Math.min(100, Math.max(0, Number(payload.voucherDiscount))),
      rewardLabel: payload.rewardLabel?.trim() || "",
      description: payload.description?.trim() || "",
      active: payload.active !== false,
    },
  };
}

export function validateBadgePayload(payload, existingBadges, editingId) {
  const name = payload.name?.trim();
  const slug = slugify(payload.slug || name);
  const triggerValue = Number(payload.triggerValue);
  const pointsReward = Number(payload.pointsReward);

  if (!name) return { ok: false, message: "Nhập tên danh hiệu." };
  if (!slug) return { ok: false, message: "Slug không hợp lệ." };
  if (!payload.category) return { ok: false, message: "Chọn nhóm danh hiệu." };
  if (!payload.triggerType) return { ok: false, message: "Chọn loại điều kiện." };
  if (Number.isNaN(triggerValue) || triggerValue < 1) {
    return { ok: false, message: "Ngưỡng điều kiện phải ≥ 1." };
  }
  if (Number.isNaN(pointsReward) || pointsReward < 0) {
    return { ok: false, message: "Điểm thưởng phải ≥ 0." };
  }

  const slugTaken = existingBadges.some((b) => b.slug === slug && b.id !== editingId);
  if (slugTaken) return { ok: false, message: `Slug "${slug}" đã tồn tại.` };

  return {
    ok: true,
    data: {
      name,
      slug,
      description: payload.description?.trim() || "",
      category: payload.category,
      triggerType: payload.triggerType,
      triggerValue,
      pointsReward,
      icon: payload.icon?.trim() || "🏅",
      active: payload.active !== false,
    },
  };
}

export function validatePointRulePayload(payload, existingRules, editingId) {
  const name = payload.name?.trim();
  const slug = slugify(payload.slug || name);
  const points = Number(payload.points);

  if (!name) return { ok: false, message: "Nhập tên quy tắc." };
  if (!slug) return { ok: false, message: "Slug không hợp lệ." };
  if (!payload.eventType) return { ok: false, message: "Chọn loại sự kiện." };
  if (Number.isNaN(points) || points < 0) {
    return { ok: false, message: "Điểm thưởng phải ≥ 0." };
  }

  const slugTaken = existingRules.some((r) => r.slug === slug && r.id !== editingId);
  if (slugTaken) return { ok: false, message: `Slug "${slug}" đã tồn tại.` };

  const intervalDays =
    payload.eventType === "streak_milestone"
      ? Math.max(1, Number(payload.intervalDays) || 7)
      : null;

  return {
    ok: true,
    data: {
      name,
      slug,
      eventType: payload.eventType,
      points,
      intervalDays,
      description: payload.description?.trim() || "",
      active: payload.active !== false,
    },
  };
}
