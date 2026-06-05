/**
 * @param {{ label: string, to?: string }[]} [breadcrumbs]
 * @param {{ backTo?: string, backLabel?: string }} [override]
 */
export function resolveAdminBackLink(breadcrumbs, override = {}) {
  const { backTo, backLabel } = override;

  if (backTo) {
    return {
      to: backTo,
      label: backLabel?.trim() || "trang trước",
    };
  }

  if (!breadcrumbs?.length) return null;

  for (let i = breadcrumbs.length - 2; i >= 0; i -= 1) {
    const item = breadcrumbs[i];
    if (item.to) {
      return { to: item.to, label: item.label };
    }
  }

  if (breadcrumbs.length === 1 && breadcrumbs[0].to) {
    return { to: breadcrumbs[0].to, label: breadcrumbs[0].label };
  }

  return null;
}
