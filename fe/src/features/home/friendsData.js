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

export function searchFriends(query) {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return [];

  return MOCK_FRIENDS.filter((user) => user.username.toLowerCase().includes(keyword));
}
