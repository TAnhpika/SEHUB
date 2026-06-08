export const DAILY_TASKS = [
  {
    id: "tests-5",
    title: "Hoàn thành 5 bài kiểm tra",
    current: 0,
    target: 5,
  },
  {
    id: "likes-7",
    title: "Thực hiện 7 like",
    current: 0,
    target: 7,
  },
  {
    id: "posts-1",
    title: "Đăng 1 bài viết",
    current: 0,
    target: 1,
  },
  {
    id: "tests-2",
    title: "Hoàn thành 2 bài kiểm tra",
    current: 0,
    target: 2,
  },
  {
    id: "posts-3",
    title: "Đăng 3 bài viết",
    current: 0,
    target: 3,
  },
];

export function getCompletedTaskCount(tasks) {
  return tasks.filter((task) => task.current >= task.target).length;
}

/** Demo: số nhiệm vụ hoàn thành tỉ lệ với streak ngày của user (tối đa 5 nhiệm vụ). */
export function buildDailyTasks(streakDays = 0) {
  const completedTasks = Math.min(Math.max(streakDays, 0), DAILY_TASKS.length);

  return DAILY_TASKS.map((task, index) => ({
    ...task,
    current: index < completedTasks ? task.target : 0,
  }));
}
