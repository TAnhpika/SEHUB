import * as profilesApi from "@/api/profilesApi";
import {
  mapBadgesForSection,
  mapFormToUpdateRequest,
  mapProfileCard,
  mapProfileRecentPost,
  mapProfileToForm,
} from "@/api/profileMapper";
import { loadPosts } from "@/features/feed/feedData";
import {
  getProfileFormData,
  saveProfileFormData,
} from "@/features/profile/profileFormData";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export const PROFILE_MOCK = {
  username: "anhcoding12345",
  displayName: "Anhpika",
  initial: "A",
  level: "COPPER",
  nextLevel: "Silver",
  pointsToNext: 50,
  levelProgress: 50,
  followers: 0,
  following: 0,
  stats: {
    points: 50,
    exams: 0,
    comments: 4,
    posts: 2,
  },
  joinedAgo: "18 ngày trước",
  updatedAgo: "18 ngày trước",
  totalActivities: 10,
};

export const BADGE_CATALOG = [
  {
    id: 1,
    code: "first-blogger",
    title: "First Blogger",
    description: "Viết bài blog đầu tiên",
    unlocked: true,
  },
  {
    id: 2,
    code: "fresh-dev",
    title: "Fresh Dev",
    description: "Hoàn thành bài thi đầu tiên",
    unlocked: false,
  },
  {
    id: 3,
    code: "active-learner",
    title: "Active Learner",
    description: "Tham gia thảo luận tích cực",
    unlocked: false,
  },
  {
    id: 4,
    code: "advanced-contributor",
    title: "Advanced Contributor",
    description: "Đóng góp 10 bài viết chất lượng",
    unlocked: false,
  },
  {
    id: 5,
    code: "elite-engineer",
    title: "Elite Engineer",
    description: "Đạt điểm cao trong 5 bài thi",
    unlocked: false,
  },
  {
    id: 6,
    code: "first-challenger",
    title: "First Challenger",
    description: "Hoàn thành thử thách đầu tiên",
    unlocked: false,
  },
  {
    id: 7,
    code: "hardworking-coder",
    title: "Hardworking Coder",
    description: "Duy trì streak 7 ngày",
    unlocked: false,
  },
  {
    id: 8,
    code: "exam-grinder",
    title: "Exam Grinder",
    description: "Làm 20 bài thi trắc nghiệm",
    unlocked: false,
  },
  {
    id: 9,
    code: "test-grandmaster",
    title: "Test Grandmaster",
    description: "Đạt điểm tuyệt đối 3 lần",
    unlocked: false,
  },
  {
    id: 10,
    code: "discussion-starter",
    title: "Discussion Starter",
    description: "Mở 5 chủ đề thảo luận mới",
    unlocked: false,
  },
];

/** @deprecated Use BADGE_CATALOG — kept for mock compatibility */
export const BADGES = BADGE_CATALOG;

export const RECENT_POSTS = [
  {
    id: 1,
    title: "Review LongNQ Ai học rùi cho e xin feedback với ạ...",
    date: "16/5/2026",
    comments: 1,
    likes: 2,
  },
  {
    id: 2,
    title: "Test...",
    date: "16/5/2026",
    comments: 3,
    likes: 2,
  },
];

const MONTHS = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function buildHeatmapCells() {
  const cells = [];
  let id = 0;

  for (let week = 0; week < 26; week += 1) {
    for (let day = 0; day < 7; day += 1) {
      let level = 0;
      if (week >= 22 && day >= 2 && day <= 5) {
        level = 1 + ((week + day) % 3);
      }
      if (week === 24 && day === 4) {
        level = 3;
      }

      cells.push({ id: id++, week, day, level });
    }
  }

  return { months: MONTHS, dayLabels: DAY_LABELS, cells };
}

export const HEATMAP_DATA = buildHeatmapCells();

export function getProfileByUsername(username) {
  const resolvedUsername = username || PROFILE_MOCK.username;

  return {
    ...PROFILE_MOCK,
    username: resolvedUsername,
    displayName: PROFILE_MOCK.displayName,
    initial: PROFILE_MOCK.displayName.charAt(0).toUpperCase(),
  };
}

export function loadProfileBadges(profileDto) {
  if (USE_MOCK) {
    return BADGE_CATALOG;
  }

  return mapBadgesForSection(BADGE_CATALOG, profileDto?.badges ?? []);
}

export async function loadRecentPostsByUsername(username, { limit = 5 } = {}) {
  const resolvedUsername = (username || PROFILE_MOCK.username).trim();

  if (USE_MOCK) {
    return RECENT_POSTS;
  }

  try {
    const { items } = await loadPosts({ page: 1, pageSize: 50 });
    return items
      .filter((post) => post.author?.username === resolvedUsername)
      .slice(0, limit)
      .map(mapProfileRecentPost);
  } catch {
    return [];
  }
}

export async function loadProfileByUsername(
  username,
  { includeMyStats = false, profileDto = null, postsCount = 0 } = {},
) {
  const resolvedUsername = (username || PROFILE_MOCK.username).trim();

  if (USE_MOCK) {
    return getProfileByUsername(resolvedUsername);
  }

  const dto = profileDto ?? (await profilesApi.getProfileByUsername(resolvedUsername));
  let statsDto = null;

  if (includeMyStats) {
    try {
      statsDto = await profilesApi.getMyStats();
    } catch {
      /* stats optional for profile card */
    }
  }

  return mapProfileCard(dto, statsDto, { postsCount });
}

export async function loadProfileForm(username, authUser) {
  const localForm = getProfileFormData(username, { email: authUser?.email });

  if (USE_MOCK) {
    return localForm;
  }

  try {
    const dto = await profilesApi.getProfileByUsername(username);
    return mapProfileToForm(dto, authUser, localForm);
  } catch {
    return localForm;
  }
}

export async function saveMyProfile(form) {
  if (USE_MOCK) {
    saveProfileFormData(form.username, form);
    return getProfileByUsername(form.username);
  }

  const body = mapFormToUpdateRequest(form);
  const dto = await profilesApi.updateMyProfile(body);
  saveProfileFormData(form.username, form);

  let statsDto = null;
  try {
    statsDto = await profilesApi.getMyStats();
  } catch {
    /* stats optional */
  }

  return mapProfileCard(dto, statsDto);
}
