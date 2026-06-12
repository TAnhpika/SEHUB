import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/context";
import ActivityHeatmap from "@/features/profile/ActivityHeatmap/ActivityHeatmap";
import BadgesSection from "@/features/profile/BadgesSection/BadgesSection";
import ProfileCard from "@/features/profile/ProfileCard/ProfileCard";
import RecentPosts from "@/features/profile/RecentPosts/RecentPosts";
import {
  loadProfileBadges,
  loadProfileByUsername,
  loadRecentPostsByUsername,
} from "@/features/profile/profileData";
import ProfileInteractionActions from "@/features/social/ProfileInteractionActions/ProfileInteractionActions";
import * as profilesApi from "@/api/profilesApi";
import styles from "./ProfilePage.module.css";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

function ProfilePage() {
  const { username } = useParams();
  const { user, isPremium } = useAuth();
  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isOwner = Boolean(user?.username && user.username === username);

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

        const [posts, badgeList] = await Promise.all([
          loadRecentPostsByUsername(username),
          Promise.resolve(loadProfileBadges(profileDto ?? { badges: [] })),
        ]);

        const card = await loadProfileByUsername(username, {
          includeMyStats: isOwner,
          profileDto,
          postsCount: posts.length,
        });

        if (!cancelled) {
          setProfile(card);
          setBadges(badgeList);
          setRecentPosts(posts);
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
    return (
      <div className={styles.page}>
        <p>Đang tải profile...</p>
      </div>
    );
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
        />
        {!isOwner && profile.userId ? (
          <ProfileInteractionActions profile={profile} onFollowChange={handleFollowChange} />
        ) : null}
      </div>

      <div className={styles.main}>
        <ActivityHeatmap
          streakCount={profile.streakCount ?? 0}
          totalActivities={profile.totalActivities ?? 0}
          showChart={USE_MOCK}
        />
        <BadgesSection badges={badges} />
        <RecentPosts posts={recentPosts} />
      </div>
    </div>
  );
}

export default ProfilePage;
