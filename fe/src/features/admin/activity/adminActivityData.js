import * as adminApi from "@/api/adminApi";
import { mapAdminAuditLogItem } from "@/api/adminMapper";
import { getMergedActivityLog } from "@/features/admin/adminMockData";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export async function loadAdminActivityLog() {
  if (USE_MOCK) {
    return {
      items: getMergedActivityLog(),
      stats: null,
    };
  }

  const page = await adminApi.listAuditLogs({ pageSize: 200 });
  return {
    items: (page.items ?? []).map(mapAdminAuditLogItem),
    stats: page.stats ?? null,
  };
}

export async function loadAdminActivityPreview(limit = 4) {
  const { items } = await loadAdminActivityLog();
  return items.slice(0, limit).map(({ id, time, text, type }) => ({ id, time, text, type }));
}
