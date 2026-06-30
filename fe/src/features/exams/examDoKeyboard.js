export const MAX_ANSWER_SHORTCUTS = 6;

export function getAnswerShortcutKey(optionIndex) {
  return optionIndex < MAX_ANSWER_SHORTCUTS ? String(optionIndex + 1) : null;
}

export function resolveOptionKeyFromDigit(digitKey, options) {
  const index = Number(digitKey) - 1;
  if (index < 0 || index >= options.length || index >= MAX_ANSWER_SHORTCUTS) return null;
  return options[index]?.key ?? null;
}

export function shouldIgnoreExamShortcut(event) {
  if (event.defaultPrevented) return true;
  if (event.altKey || event.ctrlKey || event.metaKey) return true;
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  if (target.closest('[role="dialog"]')) return true;
  return false;
}
