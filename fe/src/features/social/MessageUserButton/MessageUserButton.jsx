import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComment } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { useToast } from "@/common/Toast/ToastProvider";
import { openConversationWithUser } from "@/features/chat/messagesData";

function MessageUserButton({
  userId,
  size = "sm",
  look = "outline",
  className = "",
  label = "Nhắn tin",
  showIcon = true,
}) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  if (!userId) {
    return null;
  }

  async function handleClick() {
    if (loading) return;

    setLoading(true);
    try {
      const conversation = await openConversationWithUser(userId);
      navigate("/home/messages", {
        state: { conversationId: conversation.conversationId },
      });
    } catch (err) {
      showToast(err.message ?? "Không mở được hội thoại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      look={look}
      size={size}
      className={className}
      disabled={loading}
      onClick={handleClick}
    >
      {showIcon ? <FontAwesomeIcon icon={faComment} /> : null}
      {loading ? "Đang mở..." : label}
    </Button>
  );
}

export default MessageUserButton;
