import {
  faAward,
  faCrown,
  faGem,
  faMedal,
} from "@fortawesome/free-solid-svg-icons";

const RANK_CONFIG = {
  bronze: {
    icon: faMedal,
    label: "Bronze",
    tone: "bronze",
    badgeClass: "rankBronze",
    iconClass: "iconBronze",
    badgeStyleClass: "badgeBronze",
  },
  silver: {
    icon: faAward,
    label: "Silver",
    tone: "silver",
    badgeClass: "rankSilver",
    iconClass: "iconSilver",
    badgeStyleClass: "badgeSilver",
  },
  gold: {
    icon: faCrown,
    label: "Gold",
    tone: "gold",
    badgeClass: "rankGold",
    iconClass: "iconGold",
    badgeStyleClass: "badgeGold",
  },
  platinum: {
    icon: faGem,
    label: "Platinum",
    tone: "platinum",
    badgeClass: "rankPlatinum",
    iconClass: "iconPlatinum",
    badgeStyleClass: "badgePlatinum",
  },
  diamond: {
    icon: faGem,
    label: "Diamond",
    tone: "platinum",
    badgeClass: "rankPlatinum",
    iconClass: "iconPlatinum",
    badgeStyleClass: "badgePlatinum",
  },
};

const DEFAULT_RANK = RANK_CONFIG.bronze;
const LEVEL_ORDER = ["bronze", "silver", "gold", "platinum", "diamond"];

export function deriveNextLevelLabel(level) {
  const key = normalizeRankKey(level);
  if (!key) return null;
  const index = LEVEL_ORDER.indexOf(key);
  if (index >= 0 && index < LEVEL_ORDER.length - 1) {
    return RANK_CONFIG[LEVEL_ORDER[index + 1]].label;
  }
  return null;
}

export function normalizeRankKey(level) {
  const key = String(level ?? "").trim().toLowerCase();
  return RANK_CONFIG[key] ? key : null;
}

export function getRankDisplay(level) {
  const key = normalizeRankKey(level);
  return key ? RANK_CONFIG[key] : DEFAULT_RANK;
}

/** @param {string} level */
export function getRankBadgeClass(level) {
  return getRankDisplay(level).badgeClass;
}

export function getRankIconClass(level, rankStyles) {
  const { iconClass } = getRankDisplay(level);
  return rankStyles[iconClass] ?? "";
}

export function getRankBadgeStyleClass(level, rankStyles) {
  const { badgeStyleClass } = getRankDisplay(level);
  return rankStyles[badgeStyleClass] ?? "";
}
