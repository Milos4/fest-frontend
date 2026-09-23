import axios from "axios";
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { profilePictureOrDefault } from "../../utils/profilePicture";

import {
  faHeart,
  faThumbsUp,
  faLaugh,
  faSadTear,
  faAngry,
  faGrinStars,
} from "@fortawesome/free-solid-svg-icons";

interface Reaction {
  username: string;
  type: string;
  userID?: number;
  userId?: number;
  userProfilePictureUrl?: string;
  profilePictureUrl?: string;
  userProfilePic?: string;
  profilePicture?: string;
  user?: {
    bio?: {
      profilePictureUrl?: string;
    };
  };
}

interface ReactionPopupProps {
  reactions: Reaction[];
  onClose: () => void;
}

const ReactionPopup: React.FC<ReactionPopupProps> = ({
  reactions,
  onClose,
}) => {
  const [filter, setFilter] = useState("ALL");
  const [profileImagesByUserId, setProfileImagesByUserId] = useState<{
    [userId: number]: string;
  }>({});
  const navigate = useNavigate();

  const handleUsernameClick = (userId: number) => {
    navigate(`/profile/${userId}`);
    onClose();
  };

  const getReactionProfileImage = (reaction: Reaction) =>
    reaction.userProfilePictureUrl ||
    reaction.profilePictureUrl ||
    reaction.userProfilePic ||
    reaction.profilePicture ||
    reaction.user?.bio?.profilePictureUrl ||
    "";

  const getReactionUserId = (reaction: Reaction) =>
    reaction.userID || reaction.userId || 0;

  useEffect(() => {
    const reactionsWithoutImages = reactions.filter(
      (reaction) =>
        getReactionUserId(reaction) &&
        !getReactionProfileImage(reaction) &&
        !(getReactionUserId(reaction) in profileImagesByUserId)
    );

    const uniqueUserIds = Array.from(
      new Set(reactionsWithoutImages.map((reaction) => getReactionUserId(reaction)))
    );

    if (uniqueUserIds.length === 0) return;

    let isMounted = true;

    const fetchMissingProfileImages = async () => {
      try {
        const users = await Promise.all(
          uniqueUserIds.map(async (userId) => {
            const response = await axios.get(
              `http://localhost:8080/api/users/${userId}`
            );

            return {
              userId,
              profileImage: response.data?.bio?.profilePictureUrl || "",
            };
          })
        );

        if (!isMounted) return;

        setProfileImagesByUserId((prev) => {
          const next = { ...prev };
          users.forEach(({ userId, profileImage }) => {
            next[userId] = profileImage;
          });
          return next;
        });
      } catch (error) {
        console.error("Error fetching reaction profile images:", error);
      }
    };

    fetchMissingProfileImages();

    return () => {
      isMounted = false;
    };
  }, [reactions, profileImagesByUserId]);

  const groupedReactions = reactions.reduce((acc, reaction) => {
    acc[reaction.type] = acc[reaction.type] || [];
    const userId = getReactionUserId(reaction);

    acc[reaction.type].push({
      userId,
      username: reaction.username,
      type: reaction.type,
      profileImage:
        getReactionProfileImage(reaction) || profileImagesByUserId[userId] || "",
    });
    return acc;
  }, {} as { [key: string]: { userId: number; username: string; type: string; profileImage: string }[] });

  const availableReactions = Object.keys(groupedReactions);
  const filteredUsers =
    filter === "ALL"
      ? Object.values(groupedReactions).flat()
      : groupedReactions[filter] || [];

  const renderReactionIcon = (type: string) => {
    switch (type) {
      case "LIKE":
        return <FontAwesomeIcon icon={faThumbsUp} />;
      case "LOVE":
        return <FontAwesomeIcon icon={faHeart} />;
      case "LAUGH":
        return <FontAwesomeIcon icon={faLaugh} />;
      case "SAD":
        return <FontAwesomeIcon icon={faSadTear} />;
      case "ANGRY":
        return <FontAwesomeIcon icon={faAngry} />;
      case "WOW":
        return <FontAwesomeIcon icon={faGrinStars} />;
      default:
        return <FontAwesomeIcon icon={faThumbsUp} />;
    }
  };

  return (
    <div className="post-popup-overlay" onClick={onClose}>
      <div className="post-popup-card" onClick={(e) => e.stopPropagation()}>
        <div className="post-popup-header">
          <div>
            <h3>Likes</h3>
            <p>{reactions.length} people reacted</p>
          </div>
          <button className="post-popup-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="reaction-filter-row">
          <button
            className={`reaction-filter ${filter === "ALL" ? "active" : ""}`}
            onClick={() => setFilter("ALL")}
          >
            All
          </button>
          {availableReactions.map((reactionType) => (
            <button
              key={reactionType}
              className={`reaction-filter ${
                filter === reactionType ? "active" : ""
              }`}
              onClick={() => setFilter(reactionType)}
            >
              {renderReactionIcon(reactionType)}
              <span>{groupedReactions[reactionType].length}</span>
            </button>
          ))}
        </div>

        <div className="post-popup-list">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user, idx) => (
              <button
                key={`${user.userId}-${idx}`}
                className="reaction-user-row"
                onClick={() => handleUsernameClick(user.userId)}
              >
                <span className="reaction-user-avatar">
                  <img
                    src={profilePictureOrDefault(user.profileImage)}
                    alt={user.username}
                  />
                </span>
                <span className="reaction-user-name">{user.username}</span>
                <span className="reaction-user-type">
                  {renderReactionIcon(user.type)}
                </span>
              </button>
            ))
          ) : (
            <div className="post-popup-empty">No reactions yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReactionPopup;
