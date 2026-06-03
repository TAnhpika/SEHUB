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
    target: 2,
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
