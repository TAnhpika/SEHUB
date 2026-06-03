export const CONVERSATIONS = [
  {
    id: "anhcoding12345",
    name: "anhcoding12345",
    initials: "A",
    avatarBg: "#dbeafe",
    avatarColor: "#2563eb",
    preview: "Hiện tại thì ổn rồi đó...",
    time: "14:20",
    unread: 2,
    online: true,
    typing: true,
    messages: [
      { id: "d1", type: "date", label: "HÔM NAY" },
      {
        id: "m1",
        type: "received",
        text: "Chào bạn, mình thấy bài viết của bạn về AI rất hay. Bạn có thể chia sẻ thêm tài liệu không?",
        time: "14:15",
      },
      {
        id: "m2",
        type: "sent",
        text: "Hiện tại thì ổn rồi đó, mình gửi link Drive cho bạn nhé!",
        time: "14:18",
      },
    ],
  },
  {
    id: "phuong-thao",
    name: "Phuong Thao",
    initials: "PT",
    avatarBg: "#ede9fe",
    avatarColor: "#7c3aed",
    preview: "Mai mình học nhóm nhé",
    time: "Hôm qua",
    unread: 1,
    online: true,
    typing: false,
    messages: [
      { id: "d1", type: "date", label: "HÔM QUA" },
      {
        id: "m1",
        type: "received",
        text: "Mai mình học nhóm nhé, bạn rảnh lúc nào?",
        time: "21:40",
      },
      {
        id: "m2",
        type: "sent",
        text: "Mình rảnh buổi chiều, khoảng 2h nhé.",
        time: "21:52",
      },
    ],
  },
  {
    id: "le-anh",
    name: "Lê Anh",
    initials: "LA",
    avatarBg: "#ffedd5",
    avatarColor: "#ea580c",
    preview: "Bạn: Ok nhé, mai gặp",
    time: "2 ngày",
    unread: 0,
    online: false,
    typing: false,
    messages: [
      { id: "d1", type: "date", label: "2 NGÀY TRƯỚC" },
      {
        id: "m1",
        type: "received",
        text: "Tuần sau có buổi review FE không?",
        time: "09:10",
      },
      {
        id: "m2",
        type: "sent",
        text: "Ok nhé, mai gặp",
        time: "09:25",
      },
    ],
  },
  {
    id: "unknown",
    name: "Unknown User",
    initials: null,
    avatarBg: "#dbeafe",
    avatarColor: "#2563eb",
    preview: "ngonn",
    time: "18 ngày trước",
    unread: 0,
    online: null,
    typing: false,
    messages: [
      {
        id: "m1",
        type: "received",
        text: "ngonn",
        time: "10:05",
      },
    ],
  },
];

export function getConversationById(id) {
  return CONVERSATIONS.find((item) => item.id === id) ?? CONVERSATIONS[0];
}

/** Danh sách rút gọn cho popup chat nhanh */
export const CHAT_CONVERSATIONS = CONVERSATIONS.map(
  ({ id, name, initials, avatarBg, avatarColor, preview, time, online }) => ({
    id,
    name,
    initials,
    avatarBg,
    avatarColor,
    preview,
    time,
    online,
  }),
);
