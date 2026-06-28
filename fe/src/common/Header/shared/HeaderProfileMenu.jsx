import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";

/**
 * Shared profile dropdown shell for staff/community headers.
 *
 * @param {{
 *   open: boolean;
 *   onToggle: () => void;
 *   onBlur?: (event: import('react').FocusEvent<HTMLDivElement>) => void;
 *   initial: string;
 *   displayName: string;
 *   roleLabel?: string;
 *   menuClassName?: string;
 *   triggerClassName?: string;
 *   avatarClassName?: string;
 *   nameClassName?: string;
 *   metaClassName?: string;
 *   roleClassName?: string;
 *   chevronClassName?: string;
 *   chevronOpenClassName?: string;
 *   rootClassName?: string;
 *   rootOpenClassName?: string;
 *   children: import('react').ReactNode;
 * }} props
 */
function HeaderProfileMenu({
  open,
  onToggle,
  onBlur,
  initial,
  displayName,
  roleLabel,
  menuClassName,
  triggerClassName,
  avatarClassName,
  nameClassName,
  metaClassName,
  roleClassName,
  chevronClassName,
  chevronOpenClassName,
  rootClassName,
  rootOpenClassName,
  children,
}) {
  const rootClasses = [rootClassName, open ? rootOpenClassName : ""].filter(Boolean).join(" ");
  const chevronClasses = [chevronClassName, open ? chevronOpenClassName : ""].filter(Boolean).join(" ");

  return (
    <div className={rootClasses} onBlur={onBlur}>
      <button
        type="button"
        className={triggerClassName}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className={avatarClassName} aria-hidden="true">
          {initial}
        </span>
        {roleLabel ? (
          <span className={metaClassName}>
            <span className={nameClassName}>{displayName}</span>
            <span className={roleClassName}>{roleLabel}</span>
          </span>
        ) : (
          <span className={nameClassName}>{displayName}</span>
        )}
        <FontAwesomeIcon icon={faChevronDown} className={chevronClasses} />
      </button>

      {open ? (
        <div className={menuClassName} role="menu">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function HeaderProfileLogoutItem({ className, iconClassName, onClick }) {
  return (
    <button type="button" className={className} role="menuitem" onClick={onClick}>
      {iconClassName ? (
        <span className={iconClassName}>
          <FontAwesomeIcon icon={faRightFromBracket} />
        </span>
      ) : (
        <FontAwesomeIcon icon={faRightFromBracket} />
      )}
      Đăng xuất
    </button>
  );
}

export default HeaderProfileMenu;
