import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/context";
import ActivityHeatmap from "@/features/profile/ActivityHeatmap/ActivityHeatmap";
import BadgesSection from "@/features/profile/BadgesSection/BadgesSection";
import RecentPosts from "@/features/profile/RecentPosts/RecentPosts";
import FriendProfileCard from "@/features/home/FriendProfileCard/FriendProfileCard";
import IntroductionSection from "@/features/home/IntroductionSection/IntroductionSection";
import {
  loadProfileBadges,
  loadProfileByUsername,
  loadRecentPostsByUsername,
} from "@/features/profile/profileData";
import * as profilesApi from "@/api/profilesApi";
import styles from "./FriendProfilePage.module.css";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

function FriendProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

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

        const [posts, badgeList] = await Promise.all([
          loadRecentPostsByUsername(username),
          Promise.resolve(loadProfileBadges(profileDto ?? { badges: [] })),
        ]);

        const card = await loadProfileByUsername(username, {
          includeMyStats: false,
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
    return (
      <div className={styles.page}>
        <p>Đang tải profile...</p>
      </div>
    );
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
        <FriendProfileCard profile={profile} onFollowChange={handleFollowChange} />
      </div>

      <div className={styles.main}>
        <IntroductionSection introduction={profile.bio ?? ""} />
        <ActivityHeatmap totalActivities={profile.totalActivities} />
        <BadgesSection badges={badges} />
        <RecentPosts posts={recentPosts} />
      </div>
    </div>
  );
}

export default FriendProfilePage;
