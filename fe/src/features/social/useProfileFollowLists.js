import { useCallback, useState } from "react";
import { useAuth } from "@/context";

export function useProfileFollowLists(_profileUserId, hasProfile = false) {
  const { user } = useAuth();
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followModalMode, setFollowModalMode] = useState("followers");

  const canLoadFollowLists = hasProfile && Boolean(user?.id);

  const openFollowersModal = useCallback(() => {
    setFollowModalMode("followers");
    setFollowModalOpen(true);
  }, []);

  const openFollowingModal = useCallback(() => {
    setFollowModalMode("following");
    setFollowModalOpen(true);
  }, []);

  const closeFollowModal = useCallback(() => {
    setFollowModalOpen(false);
  }, []);

  return {
    canLoadFollowLists,
    followModalOpen,
    followModalMode,
    openFollowersModal,
    openFollowingModal,
    closeFollowModal,
  };
}
