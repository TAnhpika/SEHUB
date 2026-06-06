import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/context";
import ActivityHeatmap from "@/features/profile/ActivityHeatmap/ActivityHeatmap";
import BadgesSection from "@/features/profile/BadgesSection/BadgesSection";
import ProfileCard from "@/features/profile/ProfileCard/ProfileCard";
import RecentPosts from "@/features/profile/RecentPosts/RecentPosts";
import {
  BADGES,
  RECENT_POSTS,
  getProfileByUsername,
} from "@/features/profile/profileData";
import styles from "./ProfilePage.module.css";

function ProfilePage() {
  const { username } = useParams();
  const { user, isPremium } = useAuth();
  const profile = useMemo(() => getProfileByUsername(username), [username]);
  const isOwner = user?.username === profile.username;

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
