import { useMemo } from "react";
import { Navigate, useParams } from "react-router-dom";
import ActivityHeatmap from "@/features/profile/ActivityHeatmap/ActivityHeatmap";
import BadgesSection from "@/features/profile/BadgesSection/BadgesSection";
import RecentPosts from "@/features/profile/RecentPosts/RecentPosts";
import { BADGES } from "@/features/profile/profileData";
import FriendProfileCard from "@/features/home/FriendProfileCard/FriendProfileCard";
import IntroductionSection from "@/features/home/IntroductionSection/IntroductionSection";
import { getFriendProfileByUsername, MOCK_FRIENDS } from "@/features/home/friendsData";
import styles from "./FriendProfilePage.module.css";

function FriendProfilePage() {
  const { username } = useParams();
  const profile = useMemo(() => getFriendProfileByUsername(username), [username]);
  const exists = MOCK_FRIENDS.some((friend) => friend.username === username);

  if (!exists) {
    return <Navigate to="/home/friends" replace />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.sidebar}>
        <FriendProfileCard profile={profile} />
      </div>

      <div className={styles.main}>
        <IntroductionSection introduction={profile.introduction} />
        <ActivityHeatmap totalActivities={profile.totalActivities} />
        <BadgesSection badges={BADGES} />
        <RecentPosts posts={profile.posts} />
      </div>
    </div>
  );
}

export default FriendProfilePage;
