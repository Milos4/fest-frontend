import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Profile from "./ProfileDetails";
import UserPosts from "../post/UserPosts";
import { getInstagramDisplayName } from "../../utils/instagram";
import "./profileDetails.css";

interface ProfileStats {
  postCount: number;
  followersCount: number;
  followingCount: number;
}

const MyProfileOverview: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [profileStats, setProfileStats] = useState<ProfileStats>({
    postCount: 0,
    followersCount: 0,
    followingCount: 0,
  });

  const loggedInUser = JSON.parse(localStorage.getItem("userData") || "{}");
  const currentUserId = loggedInUser.id;

  const fetchProfileStats = useCallback(async () => {
    if (!currentUserId) return;

    try {
      const response = await axios.get(
        `http://localhost:8080/api/users/${currentUserId}/stats`
      );
      setProfileStats({
        postCount: Number(response.data.postCount) || 0,
        followersCount: Number(response.data.followersCount) || 0,
        followingCount: Number(response.data.followingCount) || 0,
      });
    } catch (error) {
      console.error("Error fetching own profile stats:", error);
    }
  }, [currentUserId]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUserId) return;

      try {
        const response = await axios.get(
          `http://localhost:8080/api/users/${currentUserId}`
        );
        setUserData(response.data);
      } catch (error) {
        console.error("Error fetching own profile:", error);
      }
    };

    fetchProfile();
  }, [currentUserId]);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!currentUserId) return;

      try {
        const response = await axios.get(
          `http://localhost:8080/api/posts/${currentUserId}`
        );
        setPosts(
          [...response.data].sort(
            (a, b) =>
              new Date(b.creationDate).getTime() -
              new Date(a.creationDate).getTime()
          )
        );
      } catch (error) {
        console.error("Error fetching own posts:", error);
        setPosts([]);
      }
    };

    fetchPosts();
  }, [currentUserId]);

  useEffect(() => {
    fetchProfileStats();
  }, [fetchProfileStats]);

  useEffect(() => {
    const handleStatsRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<{ userId?: number }>;
      const refreshedUserId = customEvent.detail?.userId;

      if (!refreshedUserId || Number(refreshedUserId) === Number(currentUserId)) {
        fetchProfileStats();
      }
    };

    window.addEventListener("profile-stats-refresh", handleStatsRefresh);

    return () => {
      window.removeEventListener("profile-stats-refresh", handleStatsRefresh);
    };
  }, [currentUserId, fetchProfileStats]);

  if (!userData) return null;

  const interests = Array.isArray(userData.bio?.interests)
    ? userData.bio.interests
    : typeof userData.bio?.interests === "string"
    ? userData.bio.interests
        .split(",")
        .map((interest: string) => interest.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="profile-overview-page">
      <Profile
        userData={userData}
        isOwnProfile={true}
        isPrivateProfile={Boolean(userData.bio?.privateProfile)}
        isFollowing={false}
        hasPendingRequest={false}
        canViewProfile={true}
        isFollowLoading={false}
        onFollowToggle={() => undefined}
        postCount={profileStats.postCount}
        followerCount={profileStats.followersCount}
        followingCount={profileStats.followingCount}
      />

      <div className="profile-bio-panel">
        <h3>Bio</h3>
        <div className="profile-bio-grid">
          <div className="profile-bio-item">
            <span className="profile-bio-label">Location</span>
            <span>{userData.bio?.location || "Not available"}</span>
          </div>
          <div className="profile-bio-item">
            <span className="profile-bio-label">Preferred Language</span>
            <span>{userData.bio?.preferredLanguage || "Not specified"}</span>
          </div>
          <div className="profile-bio-item">
            <span className="profile-bio-label">Date of Birth</span>
            <span>{userData.bio?.dateOfBirth || "Not available"}</span>
          </div>
          <div className="profile-bio-item">
            <span className="profile-bio-label">Instagram</span>
            {userData.bio?.instagramProfileUrl ? (
              <a
                href={userData.bio.instagramProfileUrl}
                target="_blank"
                rel="noreferrer"
                className="profile-bio-link"
              >
                {getInstagramDisplayName(userData.bio.instagramProfileUrl)}
              </a>
            ) : (
              <span>Not available</span>
            )}
          </div>
        </div>

        <div className="profile-bio-interests">
          <span className="profile-bio-label">Interests</span>
          <div className="profile-interest-list">
            {interests.length > 0
              ? interests.map((interest: string, index: number) => (
                  <span key={index} className="profile-interest-chip">
                    {interest}
                  </span>
                ))
              : "No interests listed."}
          </div>
        </div>
      </div>

      <UserPosts posts={posts} setPosts={setPosts} />
    </div>
  );
};

export default MyProfileOverview;
