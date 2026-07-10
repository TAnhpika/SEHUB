import { apiRequest } from "./httpClient";

let levelCatalogCache = null;
let levelCatalogPromise = null;

export function getBadges() {
  return apiRequest("/api/v1/gamification/badges", { auth: false });
}

export function getLevels() {
  return apiRequest("/api/v1/gamification/levels", { auth: false });
}

export function getMyVouchers() {
  return apiRequest("/api/v1/gamification/vouchers");
}

export function getMyPartnerVouchers() {
  return apiRequest("/api/v1/me/partner-vouchers");
}

export function getMyDailyMissions() {
  return apiRequest("/api/v1/gamification/me/daily-missions");
}

export function clearLevelCatalogCache() {
  levelCatalogCache = null;
  levelCatalogPromise = null;
}

export async function loadLevelCatalog({ force = false } = {}) {
  if (!force && levelCatalogCache) {
    return levelCatalogCache;
  }

  if (!force && levelCatalogPromise) {
    return levelCatalogPromise;
  }

  levelCatalogPromise = (async () => {
    const items = await getLevels();
    const mapped = (items ?? [])
      .map(mapLevelCatalogItem)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.minPoints - b.minPoints);
    levelCatalogCache = mapped;
    return mapped;
  })();

  try {
    return await levelCatalogPromise;
  } finally {
    levelCatalogPromise = null;
  }
}

export function mapBadgeCatalogItem(dto) {
  return {
    id: dto.id ?? dto.Id,
    code: dto.code ?? dto.Code,
    title: dto.name ?? dto.Name,
    description: dto.description ?? dto.Description,
  };
}

function readNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function mapLevelCatalogItem(dto) {
  const voucherPercent = dto.voucherPercent ?? dto.VoucherPercent ?? null;
  const voucherLabel =
    dto.voucherLabel ??
    dto.VoucherLabel ??
    formatLevelVoucherLabel(voucherPercent);

  return {
    id: dto.id ?? dto.Id,
    name: dto.name ?? dto.Name ?? "",
    minPoints: readNumber(dto.minPoints ?? dto.MinPoints),
    sortOrder: readNumber(dto.sortOrder ?? dto.SortOrder),
    voucherPercent,
    voucherLabel,
  };
}

export function formatLevelVoucherLabel(voucherPercent) {
  if (voucherPercent == null || voucherPercent <= 0) return null;
  return `Voucher FTES ${voucherPercent}%`;
}

export function mapRankVoucherDto(dto) {
  return {
    id: dto.id ?? dto.Id,
    levelName: dto.levelName ?? dto.LevelName ?? "—",
    discountPercent: dto.discountPercent ?? dto.DiscountPercent ?? 0,
    status: dto.status ?? dto.Status ?? "Unknown",
    expiresAt: dto.expiresAt ?? dto.ExpiresAt,
    grantedAt: dto.grantedAt ?? dto.GrantedAt,
  };
}

export function mapPartnerVoucherDto(dto) {
  return {
    id: dto.id ?? dto.Id,
    code: dto.code ?? dto.Code ?? "",
    typeLabel: dto.typeLabel ?? dto.TypeLabel ?? "",
    discountPercent: dto.discountPercent ?? dto.DiscountPercent ?? 0,
    partnerName: dto.partnerName ?? dto.PartnerName ?? "FTES",
    status: dto.status ?? dto.Status ?? "Unknown",
    expiresAt: dto.expiresAt ?? dto.ExpiresAt,
    assignedAt: dto.assignedAt ?? dto.AssignedAt,
  };
}
