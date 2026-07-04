import { useCallback, useEffect, useState } from "react";

import { useParams, useSearchParams } from "react-router-dom";

import { useAuth } from "@/context";

import ActivityHeatmap from "@/features/profile/ActivityHeatmap/ActivityHeatmap";

import BadgesSection from "@/features/profile/BadgesSection/BadgesSection";

import ProfileCard from "@/features/profile/ProfileCard/ProfileCard";

import RankLadderModal from "@/features/profile/RankLadderModal/RankLadderModal";
import ProfilePostsModal from "@/features/profile/ProfilePostsModal/ProfilePostsModal";
import FollowListModal from "@/features/social/FollowListModal/FollowListModal";
import { useProfileFollowLists } from "@/features/social/useProfileFollowLists";

import RecentPosts from "@/features/profile/RecentPosts/RecentPosts";

import { getMyLearningPath } from "@/features/exams/myLearning/myLearningPaths";

import {

  loadProfileBadges,

  loadProfileByUsername,

  loadProfileActivity,

  loadRecentPostsByUsername,

} from "@/features/profile/profileData";

import ProfilePageSkeleton from "@/features/profile/ProfilePageSkeleton/ProfilePageSkeleton";

import * as profilesApi from "@/api/profilesApi";

import styles from "./ProfilePage.module.css";



const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";



function ProfilePage() {

  const { username } = useParams();

  const [searchParams, setSearchParams] = useSearchParams();

  const { user, isPremium } = useAuth();

  const [profile, setProfile] = useState(null);

  const [badges, setBadges] = useState([]);

  const [recentPosts, setRecentPosts] = useState([]);

  const [postsTotalCount, setPostsTotalCount] = useState(0);

  const [postsModalOpen, setPostsModalOpen] = useState(false);

  const [activity, setActivity] = useState({ heatmap: null, totalActivities: 0 });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [rankModalOpen, setRankModalOpen] = useState(false);

  const isOwner = Boolean(user?.username && user.username === username);

  const {
    canLoadFollowLists,
    followModalOpen,
    followModalMode,
    openFollowersModal,
    openFollowingModal,
    closeFollowModal,
  } = useProfileFollowLists(profile?.userId, Boolean(profile));

  const handleModalItemFollowChange = useCallback(
    (_targetUserId, state) => {
      if (!isOwner) return;
      setProfile((current) =>
        current
          ? {
              ...current,
              following: Math.max(0, current.following + (state.isFollowing ? 1 : -1)),
            }
          : current,
      );
    },
    [isOwner],
  );

  const openRankModal = useCallback(() => {

    setRankModalOpen(true);

  }, []);



  const closeRankModal = useCallback(() => {

    setRankModalOpen(false);

    if (searchParams.get("ranks") === "1") {

      const next = new URLSearchParams(searchParams);

      next.delete("ranks");

      setSearchParams(next, { replace: true });

    }

  }, [searchParams, setSearchParams]);



  useEffect(() => {

    if (searchParams.get("ranks") === "1" && profile && !loading) {

      setRankModalOpen(true);

    }

  }, [searchParams, profile, loading]);



  useEffect(() => {

    let cancelled = false;



    async function fetchProfile() {

      setLoading(true);

      setError(null);



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

          setError(err.message ?? "Không tải được profile.");

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



  if (loading) {

    return <ProfilePageSkeleton />;

  }



  if (error) {

    return (

      <div className={styles.page}>

        <p role="alert">{error}</p>

      </div>

    );

  }



  if (!profile) {

    return (

      <div className={styles.page}>

        <p>Không tìm thấy profile.</p>

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

        <ProfileCard

          profile={profile}

          isOwner={isOwner}

          isPremiumUsername={isOwner && isPremium}

          onFollowChange={!isOwner ? handleFollowChange : undefined}

          onOpenRankLadder={openRankModal}

          examHistoryTo={isOwner && isPremium ? getMyLearningPath("exams") : undefined}

          onOpenFollowers={canLoadFollowLists ? openFollowersModal : undefined}

          onOpenFollowing={canLoadFollowLists ? openFollowingModal : undefined}

        />

      </div>



      <div className={styles.main}>

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



      <RankLadderModal

        open={rankModalOpen}

        onClose={closeRankModal}

        profile={profile}

        isOwner={isOwner}

      />

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

        onItemFollowChange={handleModalItemFollowChange}

      />

    </div>

  );

}



export default ProfilePage;


