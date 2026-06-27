import * as adminApi from "@/api/adminApi";
import { mapAdminAuditLogItem } from "@/api/adminMapper";
import { getMergedActivityLog } from "@/features/admin/adminMockData";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export async function loadAdminActivityLog() {
  if (USE_MOCK) {
    return getMergedActivityLog();
  }

  const page = await adminApi.listAuditLogs({ pageSize: 50 });
  return (page.items ?? []).map(mapAdminAuditLogItem);
}

export async function loadAdminActivityPreview(limit = 4) {
  const items = await loadAdminActivityLog();
  return items.slice(0, limit).map(({ id, time, text, type }) => ({ id, time, text, type }));
}
