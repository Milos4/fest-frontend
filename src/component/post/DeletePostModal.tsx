import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

interface DeletePostModalProps {
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeletePostModal: React.FC<DeletePostModalProps> = ({
  isDeleting,
  onClose,
  onConfirm,
}) => {
  return (
    <div className="post-popup-overlay" onClick={onClose}>
      <div className="delete-popup-card" onClick={(e) => e.stopPropagation()}>
        <div className="delete-popup-header">
          <div>
            <h3>Delete post</h3>
            <p>This will remove the post, comments, and likes.</p>
          </div>
          <button className="post-popup-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="delete-popup-body">
          <p>Are you sure you want to delete this post?</p>
          <div className="report-actions">
            <button
              className="report-cancel"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              className="delete-confirm"
              onClick={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeletePostModal;
