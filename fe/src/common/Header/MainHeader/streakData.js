import * as gamificationApi from "@/api/gamificationApi";

export function getCompletedTaskCount(tasks) {
  return tasks.filter((task) => task.current >= task.target).length;
}

function mapDailyMissionDto(dto) {
  return {
    id: dto.code ?? dto.id,
    title: dto.title ?? dto.name ?? "Nhiệm vụ",
    current: Number(dto.current ?? 0),
    target: Number(dto.target ?? 1),
  };
}

export async function loadDailyTasks() {
  try {
    const missions = await gamificationApi.getMyDailyMissions();
    const tasks = (missions ?? []).map(mapDailyMissionDto);
    return { tasks, error: null };
  } catch {
    return { tasks: [], error: true };
  }
}
