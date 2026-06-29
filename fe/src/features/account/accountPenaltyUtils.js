import { formatDateTimeFromApi } from "@/utils/dateTime";

export function isAccountPenaltyNotification(item) {
  if (item?.type !== "moderation") {
    return false;
  }

  const title = String(item.title ?? "");
  return title.includes("cảnh cáo") || title.includes("bị khóa");
}

export function resolvePenaltyTypeFromNotification(item) {
  const title = String(item.title ?? "");
  if (title.includes("bị khóa")) {
    return "Temp";
  }
  if (title.includes("cảnh cáo")) {
    return "Warning";
  }
  return null;
}

export function mapAccountPenaltyDto(dto) {
  if (!dto) {
    return null;
  }

  return {
    id: dto.id,
    penaltyType: dto.penaltyType ?? "",
    penaltyTypeLabel: dto.penaltyTypeLabel ?? "—",
    reason: dto.reason ?? "—",
    issuedAt: dto.issuedAt,
    issuedAtLabel: dto.issuedAt ? formatDateTimeFromApi(dto.issuedAt) : "—",
    until: dto.until ?? null,
    untilLabel: dto.untilLabel ?? "—",
  };
}

export async function resolvePenaltyForNotification(item) {
  const { getAccountPenalty, getLatestAccountPenalty } = await import("@/api/accountPenaltyApi");

  if (item?.referenceId) {
    try {
      const dto = await getAccountPenalty(item.referenceId);
      return mapAccountPenaltyDto(dto);
    } catch {
      // fall through to latest lookup for legacy notifications
    }
  }

  const penaltyType = resolvePenaltyTypeFromNotification(item);
  if (!penaltyType) {
    return null;
  }

  try {
    const dto = await getLatestAccountPenalty(penaltyType);
    return mapAccountPenaltyDto(dto);
  } catch {
    return null;
  }
}
