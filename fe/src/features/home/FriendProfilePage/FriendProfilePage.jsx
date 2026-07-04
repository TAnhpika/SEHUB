import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/context";
import ActivityHeatmap from "@/features/profile/ActivityHeatmap/ActivityHeatmap";
import BadgesSection from "@/features/profile/BadgesSection/BadgesSection";
import RecentPosts from "@/features/profile/RecentPosts/RecentPosts";
import ProfilePostsModal from "@/features/profile/ProfilePostsModal/ProfilePostsModal";
import FriendProfileCard from "@/features/home/FriendProfileCard/FriendProfileCard";
import IntroductionSection from "@/features/home/IntroductionSection/IntroductionSection";
import FollowListModal from "@/features/social/FollowListModal/FollowListModal";
import { useProfileFollowLists } from "@/features/social/useProfileFollowLists";
import {
  loadProfileBadges,
  loadProfileByUsername,
  loadProfileActivity,
  loadRecentPostsByUsername,
} from "@/features/profile/profileData";
import * as profilesApi from "@/api/profilesApi";
import ProfilePageSkeleton from "@/features/profile/ProfilePageSkeleton/ProfilePageSkeleton";
import styles from "./FriendProfilePage.module.css";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

function FriendProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [postsTotalCount, setPostsTotalCount] = useState(0);
  const [postsModalOpen, setPostsModalOpen] = useState(false);
  const [activity, setActivity] = useState({ heatmap: null, totalActivities: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const {
    canLoadFollowLists,
    followModalOpen,
    followModalMode,
    openFollowersModal,
    openFollowingModal,
    closeFollowModal,
  } = useProfileFollowLists(profile?.userId, Boolean(profile));

  const isOwner = Boolean(user?.username && user.username === username);

  useEffect(() => {
    if (isOwner) {
      return;
    }

    let cancelled = false;

    async function fetchProfile() {
      setLoading(true);
      setError(null);
      setNotFound(false);

      try {
        let profileDto = null;

        if (!USE_MOCK) {
          profileDto = await profilesApi.getProfileByUsername(username);
        }

        const [postsResult, badgeList, activityData] = await Promise.all([
          loadRecentPostsByUsername(username),
          loadProfileBadges(profileDto ?? { badges: [] }),
          loadProfileActivity(username),
        ]);

        const card = await loadProfileByUsername(username, { profileDto });

        if (!cancelled) {
          setProfile(card);
          setBadges(badgeList);
          setRecentPosts(postsResult.items);
          setPostsTotalCount(postsResult.totalCount);
          setActivity(activityData);
        }
      } catch (err) {
        if (!cancelled) {
          if (err.status === 404) {
            setNotFound(true);
          } else {
            setError(err.message ?? "Không tải được profile.");
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [username, isOwner]);

  if (isOwner) {
    return <Navigate to={`/profile/${username}`} replace />;
  }

  if (loading) {
    return <ProfilePageSkeleton showIntro />;
  }

  if (notFound) {
    return <Navigate to="/home/friends" replace />;
  }

  if (error || !profile) {
    return (
      <div className={styles.page}>
        <p role="alert">{error ?? "Không tải được profile."}</p>
      </div>
    );
  }

  function handleFollowChange(followState) {
    setProfile((current) =>
      current
        ? {
            ...current,
            isFollowing: followState.isFollowing,
            followers: followState.followersCount ?? current.followers,
            following: followState.followingCount ?? current.following,
          }
        : current,
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.sidebar}>
        <FriendProfileCard
          profile={profile}
          onFollowChange={handleFollowChange}
          onOpenFollowers={canLoadFollowLists ? openFollowersModal : undefined}
          onOpenFollowing={canLoadFollowLists ? openFollowingModal : undefined}
        />
      </div>

      <div className={styles.main}>
        <IntroductionSection introduction={profile.bio ?? ""} />
        <ActivityHeatmap
          streakCount={profile.streakCount ?? 0}
          totalActivities={activity.totalActivities ?? 0}
          showChart={USE_MOCK || Boolean(activity.heatmap)}
          heatmapData={activity.heatmap}
        />
        <BadgesSection badges={badges} />
        <RecentPosts
          posts={recentPosts}
          totalCount={postsTotalCount}
          onViewAll={() => setPostsModalOpen(true)}
        />
      </div>

      <ProfilePostsModal
        open={postsModalOpen}
        onClose={() => setPostsModalOpen(false)}
        username={username}
        totalCount={postsTotalCount}
      />

      <FollowListModal
        open={followModalOpen}
        onClose={closeFollowModal}
        userId={profile.userId}
        mode={followModalMode}
        totalCount={
          followModalMode === "following" ? profile.following : profile.followers
        }
        currentUserId={user?.id}
      />
    </div>
  );
}

export default FriendProfilePage;
