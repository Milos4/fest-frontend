import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

interface Comment {
  username: string;
  content: string;
  userID: number;
}

interface CommentPopupProps {
  comments: Comment[];
  onClose: () => void;
}

const CommentPopup: React.FC<CommentPopupProps> = ({ comments, onClose }) => {
  const navigate = useNavigate();

  const handleUsernameClick = (userId: number) => {
    navigate(`/profile/${userId}`);
  };
  return (
    <div className="comment-popup">
      <div className="comment-popup-header">
        <div className="comment-popup-header-text">Comments</div>
        <button className="close-btn" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      <div className="comment-list">
        {comments.map((comment, index) => (
          <div key={index} className="comment-item">
            <strong
              className="comment-username"
              onClick={() => handleUsernameClick(comment.userID)}
            >
              {comment.username}
            </strong>
            <p>{comment.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentPopup;
