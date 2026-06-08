export const NOTIFICATIONS = [
  {
    id: "notif-1",
    type: "comment",
    title: "minhpt_se đã bình luận bài viết của bạn",
    time: "10 phút trước",
    read: false,
  },
  {
    id: "notif-2",
    type: "exam",
    title: "Đề thi PRF192 vừa được cập nhật thêm 20 câu mới",
    time: "1 giờ trước",
    read: false,
  },
  {
    id: "notif-3",
    type: "streak",
    title: "Bạn đã duy trì streak — tiếp tục phát huy nhé!",
    time: "Hôm qua",
    read: false,
  },
];

export const NOTIFICATION_META = {
  comment: {
    label: "Bình luận",
    tone: "blue",
  },
  exam: {
    label: "Đề thi",
    tone: "purple",
  },
  streak: {
    label: "Streak",
    tone: "amber",
  },
};
