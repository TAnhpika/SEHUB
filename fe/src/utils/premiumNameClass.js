export const PREMIUM_USERNAME_CLASS = "username-premium";

export function withPremiumUsernameClass(className, isPremium) {
  if (!isPremium) {
    return className ?? "";
  }
  return className ? `${className} ${PREMIUM_USERNAME_CLASS}` : PREMIUM_USERNAME_CLASS;
}
