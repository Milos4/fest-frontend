import React from "react";
import "./profileDetails.css";
import { IonIcon } from "@ionic/react";
import {
  globeOutline,
  lockClosedOutline,
  mailOutline,
} from "ionicons/icons";
import { profilePictureOrDefault } from "../../utils/profilePicture";

interface ProfileDetailsProps {
  userData: any;
  isOwnProfile: boolean;
  isPrivateProfile: boolean;
  isFollowing: boolean;
  hasPendingRequest: boolean;
  canViewProfile: boolean;
  isFollowLoading: boolean;
  onFollowToggle: () => void;
  onMessageClick?: () => void;
  postCount: number;
  followerCount: number;
  followingCount: number;
}

const ProfileDetails: React.FC<ProfileDetailsProps> = ({
  userData,
  isOwnProfile,
  isPrivateProfile,
  isFollowing,
  hasPendingRequest,
  canViewProfile,
  isFollowLoading,
  onFollowToggle,
  onMessageClick,
  postCount,
  followerCount,
  followingCount,
}) => {
  const followButtonText = isFollowing
    ? "Unfollow"
    : hasPendingRequest
    ? "Requested"
    : isPrivateProfile
    ? "Request follow"
    : "Follow";

  return (
    <div className="profile-body">
      <div className="profile-card">
        <div className="profile-lines"></div>
        <div className="profile-imgBx">
          <img
            src={profilePictureOrDefault(userData.bio?.profilePictureUrl)}
            alt="Profile"
            className="profileD-picture"
          />
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

            {!isFollowing && (
              <div
                className={`profile-privacy-status ${
                  isPrivateProfile ? "private" : "public"
                }`}
              >
                <IonIcon
                  icon={isPrivateProfile ? lockClosedOutline : globeOutline}
                />
                <span>
                  {isPrivateProfile ? "Private profile" : "Public profile"}
                </span>
              </div>
            )}

            {canViewProfile && (
              <div className="profile-data">
                <h3 className="profile-h3">
                  {postCount}
                  <br />
                  <span>Posts</span>
                </h3>
                <h3 className="profile-h3">
                  {followerCount}
                  <br />
                  <span>Followers</span>
                </h3>
                <h3 className="profile-h3">
                  {followingCount}
                  <br />
                  <span>Following</span>
                </h3>
              </div>
            )}

            {!isOwnProfile && (
              <div className="profile-actionBtn">
                <button
                  onClick={onFollowToggle}
                  disabled={isFollowLoading || hasPendingRequest}
                >
                  {isFollowLoading ? "Loading..." : followButtonText}
                </button>
                <button className="profile-message-btn" onClick={onMessageClick}>
                  <IonIcon icon={mailOutline} />
                  <span>Message</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetails;
