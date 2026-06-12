import { useEffect, useState } from "react";
import * as friendsApi from "@/api/friendsApi";
import Button from "@/common/Button/Button";

const STATUS_LABELS = {
  None: "Kết bạn",
  PendingOutgoing: "Đã gửi lời mời",
  PendingIncoming: "Đồng ý kết bạn",
  Accepted: "Bạn bè",
  Self: null,
};

function FriendButton({
  userId,
  initialStatus = "None",
  initialRequestId = null,
  onChange,
  size = "sm",
  className = "",
}) {
  const [status, setStatus] = useState(initialStatus);
  const [requestId, setRequestId] = useState(initialRequestId);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setStatus(initialStatus);
    setRequestId(initialRequestId);
  }, [initialStatus, initialRequestId, userId]);

  if (!userId || status === "Self") {
    return null;
  }

  async function handleClick() {
    if (loading) return;

    setLoading(true);
    try {
      if (status === "None") {
        const result = await friendsApi.sendFriendRequest(userId);
        setStatus("PendingOutgoing");
        setRequestId(result.id);
        onChange?.({ status: "PendingOutgoing", requestId: result.id });
        return;
      }

      if (status === "PendingIncoming" && requestId) {
        await friendsApi.acceptFriendRequest(requestId);
        setStatus("Accepted");
        onChange?.({ status: "Accepted", requestId });
        return;
      }

      if (status === "PendingOutgoing" && requestId) {
        await friendsApi.cancelFriendRequest(requestId);
        setStatus("None");
        setRequestId(null);
        onChange?.({ status: "None", requestId: null });
        return;
      }

      if (status === "Accepted") {
        await friendsApi.unfriend(userId);
        setStatus("None");
        setRequestId(null);
        onChange?.({ status: "None", requestId: null });
      }
    } catch {
      /* keep current state */
    } finally {
      setLoading(false);
    }
  }

  const label = loading ? "Đang xử lý..." : STATUS_LABELS[status] ?? "Kết bạn";

  return (
    <Button
      type="button"
      size={size}
      look={status === "Accepted" || status === "PendingOutgoing" ? "outline" : undefined}
      className={className}
      disabled={loading}
      onClick={handleClick}
    >
      {label}
    </Button>
  );
}

export default FriendButton;
