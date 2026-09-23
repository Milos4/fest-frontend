import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavBar from "../component/navBar/Navbar";
import SideBar from "../component/sideBar/SideBar";
import Profile from "../component/profileDetails/ProfileDetails";
import axios from "axios";
import UserPosts from "../component/post/UserPosts";
import "../component/profileDetails/profileDetails.css";
import { getInstagramDisplayName } from "../utils/instagram";
import ChatWindow from "../component/messages/ChatWindow";
import { ChatUser } from "../component/messages/chatTypes";

interface FollowStatusResponse {
  isOwnProfile: boolean;
  isPrivateProfile: boolean;
  isFollowing: boolean;
  hasPendingRequest: boolean;
  canViewProfile: boolean;
}

interface ProfileStats {
  postCount: number;
  followersCount: number;
  followingCount: number;
}

const defaultFollowStatus: FollowStatusResponse = {
  isOwnProfile: false,
  isPrivateProfile: false,
  isFollowing: false,
  hasPendingRequest: false,
  canViewProfile: true,
};

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [activeIndex, setActiveIndex] = useState(1);
  const [posts, setPosts] = useState<any[]>([]);
  const [profileStats, setProfileStats] = useState<ProfileStats>({
    postCount: 0,
    followersCount: 0,
    followingCount: 0,
  });
  const [followStatus, setFollowStatus] =
    useState<FollowStatusResponse>(defaultFollowStatus);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState<ChatUser | null>(null);

  const loggedInUser = JSON.parse(localStorage.getItem("userData") || "{}");
  const currentUserId = loggedInUser.id;

  const handleNavbarClick = (index: number) => {
    setActiveIndex(index);

    if (index === 0) {
      navigate("/home", { state: { activeIndex: 0 } });
      return;
    }

    if (index === 1) {
      navigate(`/profile/${currentUserId}`);
      return;
    }

    navigate("/home", { state: { activeIndex: index } });
  };

  const fetchProfileStats = useCallback(async () => {
    if (!userId) {
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:8080/api/users/${userId}/stats`
      );
      setProfileStats({
        postCount: Number(response.data.postCount) || 0,
        followersCount: Number(response.data.followersCount) || 0,
        followingCount: Number(response.data.followingCount) || 0,
      });
    } catch (error) {
      console.error("Error fetching profile stats:", error);
    }
  }, [userId]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8080/api/users/${userId}`
        );
        setUserData(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  useEffect(() => {
    fetchProfileStats();
  }, [fetchProfileStats]);

  useEffect(() => {
    const handleStatsRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<{ userId?: number }>;
      const refreshedUserId = customEvent.detail?.userId;

      if (!refreshedUserId || String(refreshedUserId) === String(userId)) {
        fetchProfileStats();
      }
    };

    window.addEventListener("profile-stats-refresh", handleStatsRefresh);

    return () => {
      window.removeEventListener("profile-stats-refresh", handleStatsRefresh);
    };
  }, [fetchProfileStats, userId]);

  useEffect(() => {
    const fetchFollowStatus = async () => {
      if (!userId || !currentUserId) {
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:8080/api/follow/status?currentUserId=${currentUserId}&profileUserId=${userId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch follow status");
        }

        const data = await response.json();
        setFollowStatus(data);
      } catch (error) {
        console.error("Error fetching follow status:", error);
      }
    };

    fetchFollowStatus();
  }, [currentUserId, userId]);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!userId || !followStatus.canViewProfile) {
        setPosts([]);
        return;
      }

      try {
        const response = await axios.get(`http://localhost:8080/api/posts/${userId}`);
        const newestFirst = [...response.data].sort(
          (a, b) =>
            new Date(b.creationDate).getTime() -
            new Date(a.creationDate).getTime()
        );
        setPosts(newestFirst);
      } catch (error) {
        console.error("Error fetching posts for user:", error);
        setPosts([]);
      }
    };

    fetchPosts();
  }, [followStatus.canViewProfile, userId]);

  const handleFollowToggle = async () => {
    if (isFollowLoading || !userId || !currentUserId) {
      return;
    }

    setIsFollowLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/follow/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followerId: currentUserId,
          followingId: Number(userId),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle follow status");
      }

      const data = await response.json();
      setFollowStatus((prev) => ({
        ...prev,
        isFollowing: Boolean(data.isFollowing),
        hasPendingRequest: Boolean(data.hasPendingRequest),
        canViewProfile: prev.isOwnProfile
          ? true
          : !prev.isPrivateProfile || Boolean(data.isFollowing),
      }));

      fetchProfileStats();
    } catch (error) {
      console.error("Error toggling follow status:", error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const getChatUserFromProfile = (profile: any): ChatUser => ({
    id: Number(profile.id ?? userId),
    username: profile.username || `User ${profile.id ?? userId}`,
    firstName: profile.bio?.firstName || profile.firstName || "",
    lastName: profile.bio?.lastName || profile.lastName || "",
    profilePictureUrl:
      profile.bio?.profilePictureUrl || profile.profilePictureUrl || "",
  });

  if (!userData) {
    return null;
  }

  const isViewingOwnProfile =
    followStatus.isOwnProfile || String(currentUserId) === String(userId);
  const canViewCurrentProfile = isViewingOwnProfile || followStatus.canViewProfile;
  const currentChatUser: ChatUser = {
    id: Number(currentUserId),
    username: loggedInUser.username || `User ${currentUserId}`,
    firstName: loggedInUser.bio?.firstName || "",
    lastName: loggedInUser.bio?.lastName || "",
    profilePictureUrl: loggedInUser.bio?.profilePictureUrl || "",
  };

  const interests = Array.isArray(userData.bio?.interests)
    ? userData.bio.interests
    : typeof userData.bio?.interests === "string"
    ? userData.bio.interests
        .split(",")
        .map((interest: string) => interest.trim())
        .filter(Boolean)
    : [];

  return (
    <div
      className={`profile-page ${
        isViewingOwnProfile ? "profile-page-with-nav" : ""
      }`}
    >
      {isViewingOwnProfile && (
        <NavBar activeIndex={activeIndex} setActiveIndex={handleNavbarClick} />
      )}
      <SideBar withTopNav={isViewingOwnProfile} />
      <div className="main-content">
        <Profile
          userData={userData}
          isOwnProfile={isViewingOwnProfile}
          isPrivateProfile={followStatus.isPrivateProfile}
          isFollowing={followStatus.isFollowing}
          hasPendingRequest={followStatus.hasPendingRequest}
          canViewProfile={canViewCurrentProfile}
          isFollowLoading={isFollowLoading}
          onFollowToggle={handleFollowToggle}
          onMessageClick={() => setActiveChatUser(getChatUserFromProfile(userData))}
          postCount={profileStats.postCount}
          followerCount={profileStats.followersCount}
          followingCount={profileStats.followingCount}
        />

        {canViewCurrentProfile ? (
          <>
            <div className="profile-bio-panel">
              <h3>Bio</h3>
              <div className="profile-bio-grid">
                <div className="profile-bio-item">
                  <span className="profile-bio-label">Location</span>
                  <span>{userData.bio?.location || "Not available"}</span>
                </div>
                <div className="profile-bio-item">
                  <span className="profile-bio-label">Preferred Language</span>
                  <span>
                    {userData.bio?.preferredLanguage || "Not specified"}
                  </span>
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
                      {getInstagramDisplayName(
                        userData.bio.instagramProfileUrl
                      )}
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
          </>
        ) : (
          <div className="profile-private-panel">
            <p>
              {followStatus.hasPendingRequest
                ? "Your follow request is pending."
                : "Send a follow request to view this user's bio and posts."}
            </p>
          </div>
        )}
      </div>
      {activeChatUser && (
        <ChatWindow
          currentUser={currentChatUser}
          otherUser={activeChatUser}
          onClose={() => setActiveChatUser(null)}
        />
      )}
    </div>
  );
};

export default ProfilePage;
