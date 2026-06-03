import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

interface Comment {
  username: string;
  content: string;
  userID: number;
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

interface CommentPopupProps {
  comments: Comment[];
  onClose: () => void;
}

const CommentPopup: React.FC<CommentPopupProps> = ({ comments, onClose }) => {
  const navigate = useNavigate();

  const handleUsernameClick = (userId: number) => {
    navigate(`/profile/${userId}`);
    onClose();
  };

  const getCommentProfileImage = (comment: Comment) =>
    comment.userProfilePictureUrl ||
    comment.profilePictureUrl ||
    comment.userProfilePic ||
    comment.profilePicture ||
    comment.user?.bio?.profilePictureUrl ||
    "";

  return (
    <div className="post-popup-overlay" onClick={onClose}>
      <div className="post-popup-card" onClick={(e) => e.stopPropagation()}>
        <div className="post-popup-header">
          <div>
            <h3>Comments</h3>
            <p>{comments.length} comments on this post</p>
          </div>
          <button className="post-popup-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="post-popup-list">
          {comments.length > 0 ? (
            comments.map((comment, index) => {
              const profileImage = getCommentProfileImage(comment);

              return (
                <div key={index} className="comment-row">
                  <button
                    className="comment-avatar"
                    onClick={() => handleUsernameClick(comment.userID)}
                  >
                    {profileImage ? (
                      <img src={profileImage} alt={comment.username} />
                    ) : (
                      comment.username?.charAt(0)?.toUpperCase() || "U"
                    )}
                  </button>
                <div className="comment-bubble">
                  <button
                    className="comment-username"
                    onClick={() => handleUsernameClick(comment.userID)}
                  >
                    {comment.username}
                  </button>
                  <p>{comment.content}</p>
                </div>
              </div>
              );
            })
          ) : (
            <div className="post-popup-empty">No comments yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentPopup;
