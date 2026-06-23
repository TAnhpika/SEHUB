import { useEffect, useMemo, useState } from "react";
import { getMentionFriends } from "@/api/usersApi";
import styles from "./CommentMentionPicker.module.css";

function extractMentionQuery(value) {
  const plain = String(value ?? "").replace(/<[^>]+>/g, " ");
  const match = plain.match(/(?:^|\s)@([a-zA-Z0-9_\.]*)$/);
  return match ? match[1] : null;
}

function CommentMentionPicker({ value, onInsert }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const mentionQuery = useMemo(() => extractMentionQuery(value), [value]);

  useEffect(() => {
    if (mentionQuery === null) {
      setFriends([]);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    getMentionFriends({ search: mentionQuery, limit: 8 })
      .then((items) => {
        if (!cancelled) setFriends(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (!cancelled) setFriends([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mentionQuery]);

  if (mentionQuery === null) {
    return null;
  }

  return (
    <div className={styles.panel} role="listbox" aria-label="Gợi ý bạn bè để tag">
      {loading ? <p className={styles.hint}>Đang tải…</p> : null}
      {!loading && friends.length === 0 ? (
        <p className={styles.hint}>Không có bạn bè phù hợp (cần follow qua lại).</p>
      ) : null}
      {friends.map((friend) => (
        <button
          key={friend.userId}
          type="button"
          className={styles.item}
          onClick={() => onInsert(friend.username)}
        >
          <span className={styles.name}>{friend.fullName ?? friend.username}</span>
          <span className={styles.username}>@{friend.username}</span>
        </button>
      ))}
    </div>
  );
}

export function insertMention(currentValue, username) {
  const plain = String(currentValue ?? "");
  const replaced = plain.replace(/(?:^|\s)@([a-zA-Z0-9_\.]*)$/, (match) =>
    match.trimStart().startsWith("@") ? `@${username} ` : ` @${username} `,
  );
  if (replaced !== plain) {
    return replaced;
  }
  const suffix = plain.endsWith(" ") || plain.length === 0 ? "" : " ";
  return `${plain}${suffix}@${username} `;
}

export default CommentMentionPicker;
