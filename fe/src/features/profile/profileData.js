import * as profilesApi from "@/api/profilesApi";
import * as gamificationApi from "@/api/gamificationApi";
import {
  mapBadgesForSection,
  mapFormToUpdateRequest,
  mapProfileActivityToHeatmap,
  mapProfileCard,
  mapProfileRecentPost,
  mapProfileToForm,
} from "@/api/profileMapper";
import {
  getProfileFormData,
  saveProfileFormData,
} from "@/features/profile/profileFormData";
import {
  PROFILE_POSTS_PAGE_SIZE,
  PROFILE_POSTS_PREVIEW_LIMIT,
} from "@/features/profile/profilePostsConstants";
import { buildHeatmapGrid, HEATMAP_LOCALE } from "@/utils/heatmapCalendar";

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

function buildHeatmapCells() {
  const grid = buildHeatmapGrid({ locale: HEATMAP_LOCALE });
  const cells = grid.cells.map((cell, id) => {
    let level = 0;
    if (cell.week >= 22 && cell.day >= 2 && cell.day <= 5) {
      level = 1 + ((cell.week + cell.day) % 3);
    }
    if (cell.week === 24 && cell.day === 4) {
      level = 3;
    }

    return { ...cell, id, level };
  });

  return { months: grid.months, dayLabels: grid.dayLabels, cells };
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

let badgeCatalogCache = null;

export async function loadBadgeCatalog() {
  if (USE_MOCK) {
    return BADGE_CATALOG;
  }

  if (badgeCatalogCache) {
    return badgeCatalogCache;
  }

  try {
    const items = await gamificationApi.getBadges();
    badgeCatalogCache = (items ?? []).map(gamificationApi.mapBadgeCatalogItem);
    return badgeCatalogCache;
  } catch {
    return [];
  }
}

export async function loadProfileBadges(profileDto) {
  if (USE_MOCK) {
    return BADGE_CATALOG;
  }

  const catalog = await loadBadgeCatalog();
  return mapBadgesForSection(catalog, profileDto?.badges ?? []);
}

export async function loadProfileActivity(username, { months = 6 } = {}) {
  const resolvedUsername = (username || PROFILE_MOCK.username).trim();

  if (USE_MOCK) {
    return {
      heatmap: HEATMAP_DATA,
      totalActivities: PROFILE_MOCK.totalActivities,
    };
  }

  try {
    const dto = await profilesApi.getProfileActivityByUsername(resolvedUsername, { months });
    return {
      heatmap: mapProfileActivityToHeatmap(dto),
      totalActivities: dto?.totalActivities ?? 0,
    };
  } catch {
    return { heatmap: null, totalActivities: 0 };
  }
}

export async function loadRecentPostsByUsername(
  username,
  { limit = PROFILE_POSTS_PREVIEW_LIMIT } = {},
) {
  const resolvedUsername = (username || PROFILE_MOCK.username).trim();

  if (USE_MOCK) {
    return {
      items: RECENT_POSTS.slice(0, limit),
      totalCount: RECENT_POSTS.length,
    };
  }

  try {
    const result = await profilesApi.getProfilePostsByUsername(resolvedUsername, {
      page: 1,
      pageSize: limit,
    });
    return {
      items: (result.items ?? []).map(mapProfileRecentPost),
      totalCount: result.totalCount ?? 0,
    };
  } catch {
    return { items: [], totalCount: 0 };
  }
}

function mapProfilePostsPage(page) {
  const items = (page.items ?? []).map(mapProfileRecentPost);
  return {
    items,
    page: page.page ?? 1,
    pageSize: page.pageSize ?? items.length,
    totalCount: page.totalCount ?? items.length,
    hasNextPage: Boolean(page.hasNextPage),
  };
}

export function loadProfilePostsPage(username, page = 1) {
  const resolvedUsername = (username || PROFILE_MOCK.username).trim();

  if (USE_MOCK) {
    const start = (page - 1) * PROFILE_POSTS_PAGE_SIZE;
    const slice = RECENT_POSTS.slice(start, start + PROFILE_POSTS_PAGE_SIZE);
    return Promise.resolve({
      items: slice,
      page,
      pageSize: PROFILE_POSTS_PAGE_SIZE,
      totalCount: RECENT_POSTS.length,
      hasNextPage: start + PROFILE_POSTS_PAGE_SIZE < RECENT_POSTS.length,
    });
  }

  return profilesApi
    .getProfilePostsByUsername(resolvedUsername, {
      page,
      pageSize: PROFILE_POSTS_PAGE_SIZE,
    })
    .then(mapProfilePostsPage);
}

export async function loadProfileByUsername(username, { profileDto = null } = {}) {
  const resolvedUsername = (username || PROFILE_MOCK.username).trim();

  if (USE_MOCK) {
    return getProfileByUsername(resolvedUsername);
  }

  const dto = profileDto ?? (await profilesApi.getProfileByUsername(resolvedUsername));
  let statsDto = null;

  try {
    statsDto = await profilesApi.getProfileStatsByUsername(resolvedUsername);
  } catch {
    /* stats optional for profile card */
  }

  return mapProfileCard(dto, statsDto);
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
