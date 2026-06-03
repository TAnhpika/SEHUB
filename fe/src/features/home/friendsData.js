export const MOCK_FRIENDS = [
  { id: 1, username: "tngo282999", level: "COPPER", initial: "T" },
  { id: 2, username: "tngo28299", level: "COPPER", initial: "T" },
  { id: 3, username: "minhpt_se", level: "SILVER", initial: "M" },
  { id: 4, username: "lamnv_dev", level: "GOLD", initial: "L" },
  { id: 5, username: "hoa_tran", level: "BRONZE", initial: "H" },
  { id: 6, username: "khoa_nguyen", level: "PLATINUM", initial: "K" },
  { id: 7, username: "vy_pham", level: "COPPER", initial: "V" },
  { id: 8, username: "anh_le", level: "SILVER", initial: "A" },
];

const FRIEND_PROFILES = {
  tngo282999: {
    username: "tngo282999",
    initial: "T",
    level: "COPPER",
    nextLevel: "Silver",
    pointsToNext: 100,
    levelProgress: 0,
    followers: 0,
    following: 0,
    introduction: "",
    stats: { points: 0, exams: 0 },
    totalActivities: 0,
    posts: [],
  },
  tngo28299: {
    username: "tngo28299",
    initial: "T",
    level: "COPPER",
    nextLevel: "Silver",
    pointsToNext: 80,
    levelProgress: 20,
    followers: 2,
    following: 5,
    introduction: "Sinh viên FPT đam mê lập trình web và cộng đồng SE.",
    stats: { points: 120, exams: 3 },
    totalActivities: 4,
    posts: [],
  },
  minhpt_se: {
    username: "minhpt_se",
    initial: "M",
    level: "SILVER",
    nextLevel: "Gold",
    pointsToNext: 150,
    levelProgress: 40,
    followers: 12,
    following: 8,
    introduction: "Chia sẻ kinh nghiệm ôn thi PRF192 và SWP391.",
    stats: { points: 350, exams: 12 },
    totalActivities: 18,
    posts: [
      {
        id: 1,
        title: "Tips ôn thi PRF192 hiệu quả trong 2 tuần",
        date: "12/05/2026",
        comments: 5,
        likes: 18,
      },
      {
        id: 2,
        title: "Chia sẻ tài liệu SWP391 cho team mới",
        date: "28/04/2026",
        comments: 3,
        likes: 11,
      },
    ],
  },
};

const DEFAULT_FRIEND_PROFILE = {
  level: "COPPER",
  nextLevel: "Silver",
  pointsToNext: 100,
  levelProgress: 0,
  followers: 0,
  following: 0,
  introduction: "",
  stats: { points: 0, exams: 0 },
  totalActivities: 0,
  posts: [],
};

export function searchFriends(query) {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return [];

  return MOCK_FRIENDS.filter((user) => user.username.toLowerCase().includes(keyword));
}

export function getFriendProfileByUsername(username) {
  const friend = MOCK_FRIENDS.find((user) => user.username === username);
  const profile = FRIEND_PROFILES[username] ?? DEFAULT_FRIEND_PROFILE;

  return {
    ...DEFAULT_FRIEND_PROFILE,
    ...profile,
    username: friend?.username ?? username,
    initial: friend?.initial ?? username.charAt(0).toUpperCase(),
    level: friend?.level ?? profile.level,
  };
}
