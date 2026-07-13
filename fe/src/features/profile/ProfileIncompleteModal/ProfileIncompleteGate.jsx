import { useAuth } from "@/context";
import { useNavigate } from "react-router-dom";
import ProfileIncompleteModal from "@/features/profile/ProfileIncompleteModal/ProfileIncompleteModal";

/**
 * Soft modal after login/register when profile is incomplete.
 * Must render under BrowserRouter (AuthProvider sits above the router).
 */
function ProfileIncompleteGate() {
  const { user, profileIncompletePromptOpen, dismissProfileIncompletePrompt } = useAuth();
  const navigate = useNavigate();

  function handleUpdate() {
    const username = user?.username;
    dismissProfileIncompletePrompt();
    if (username) {
      navigate(`/profile/${username}/edit`);
    }
  }

  return (
    <ProfileIncompleteModal
      open={Boolean(profileIncompletePromptOpen && user)}
      onDismiss={dismissProfileIncompletePrompt}
      onUpdate={handleUpdate}
    />
  );
}

export default ProfileIncompleteGate;
