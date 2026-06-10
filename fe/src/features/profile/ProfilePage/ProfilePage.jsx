import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/context";
import ActivityHeatmap from "@/features/profile/ActivityHeatmap/ActivityHeatmap";
import BadgesSection from "@/features/profile/BadgesSection/BadgesSection";
import ProfileCard from "@/features/profile/ProfileCard/ProfileCard";
import RecentPosts from "@/features/profile/RecentPosts/RecentPosts";
import {
  BADGES,
  RECENT_POSTS,
  loadProfileByUsername,
} from "@/features/profile/profileData";
import styles from "./ProfilePage.module.css";

function ProfilePage() {
  const { username } = useParams();
  const { user, isPremium } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isOwner = Boolean(user?.username && user.username === username);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      setLoading(true);
      setError(null);

      try {
        const data = await loadProfileByUsername(username, { includeMyStats: isOwner });
        if (!cancelled) {
          setProfile(data);
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

  return (
    <div className={styles.page}>
      <div className={styles.sidebar}>
        <ProfileCard
          profile={profile}
          isOwner={isOwner}
          isPremiumUsername={isOwner && isPremium}
        />
      </div>

      <div className={styles.main}>
        <ActivityHeatmap totalActivities={profile.totalActivities} />
        <BadgesSection badges={BADGES} />
        <RecentPosts posts={RECENT_POSTS} />
      </div>
    </div>
  );
}

export default ProfilePage;
