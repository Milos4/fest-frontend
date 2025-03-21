import React from "react";
import "./profileDetails.css";
import profile from "../../images/Naruto.jpg";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface ProfileProps {
  userData: any; // Define the type of userData
}

const ProfileDetails: React.FC<ProfileProps> = ({ userData }) => {
  const loggedInUser = JSON.parse(localStorage.getItem("userData") || "{}");
  const isMyProfile = loggedInUser.id === userData.id;

  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkFollowingStatus = async () => {
      if (!loggedInUser.id || !userData.id || isMyProfile) return;

      try {
        const response = await fetch(
          "http://localhost:8080/api/follow/is-following",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              followerId: loggedInUser.id,
              followingId: userData.id,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch follow status");
        }

        const result = await response.json();
        setIsFollowing(result);
      } catch (error) {
        console.error("Error checking follow status:", error);
      }
    };

    checkFollowingStatus();
  }, [loggedInUser.id, userData.id, isMyProfile]);

  const handleFollowToggle = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/follow/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followerId: loggedInUser.id,
          followingId: userData.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle follow status");
      }

      const data = await response.json();
      setIsFollowing(data.isFollowing);
    } catch (error) {
      console.error("Error toggling follow status:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-body">
      <div className="profile-card">
        <div className="profile-lines"></div>
        <div className="profile-imgBx">
          {userData.bio?.profilePictureUrl && (
            <img
              src={userData.bio.profilePictureUrl}
              alt="Profile"
              className="profileD-picture"
            />
          )}
        </div>
        <div className="profile-content">
          <div className="profile-detials">
            <h2 className="profile-h2">
              {userData.username}
              <br />
              <span>
                {userData.bio?.firstName || "\u00A0"}{" "}
                {userData.bio?.lastName || "\u00A0"}
              </span>
            </h2>
            <div className="profile-data">
              <h3 className="profile-h3">
                32{/* {userData.posts} */}
                <br />
                <span>Posts</span>
              </h3>
              <h3 className="profile-h3">
                350 {/* {userData.followers} */}
                <br />
                <span>Followers</span>
              </h3>
              <h3 className="profile-h3">
                300{/* {userData.following} */}
                <br />
                <span>Following</span>
              </h3>
            </div>
            {!isMyProfile && (
              <div className="profile-actionBtn">
                <button onClick={handleFollowToggle} disabled={loading}>
                  {loading ? "Loading..." : isFollowing ? "Unfollow" : "Follow"}
                </button>
                <button>Message</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetails;
