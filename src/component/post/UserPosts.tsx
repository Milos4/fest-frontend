import React, { useState } from "react";
import axios from "axios";
import "./postlist.css";
import { DEFAULT_PROFILE_PICTURE_URL } from "../../utils/profilePicture";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faEllipsisV,
  faEarth,
} from "@fortawesome/free-solid-svg-icons";
import { faCommentAlt, faThumbsUp } from "@fortawesome/free-regular-svg-icons";
import ReactionPopup from "../reaction/ReactionPopup";
import CommentPopup from "../comment/CommentPopup";
import ReportPostModal from "./ReportPostModal";
import { reportPost } from "../../api";
import DeletePostModal from "./DeletePostModal";

interface Post {
  id: number;
  content: string;
  mediaUrl: string;
  user: string;
  userId: number;
  userProfilePic: string;
  userProfilePictureUrl?: string;
  reactions: any[];
  comments: any[];
  creationDate: string;
  tags: string[];
}

interface UserPostsProps {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
}

const UserPosts: React.FC<UserPostsProps> = ({ posts, setPosts }) => {
  const [showReactionPopup, setShowReactionPopup] = useState<boolean>(false);
  const [currentPostReactions, setCurrentPostReactions] = useState<any[]>([]);
  const [showCommentsPopup, setShowCommentsPopup] = useState<boolean>(false);
  const [currentPostComments, setCurrentPostComments] = useState<any[]>([]);

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [openMenuIdComment, setOpenMenuIdComment] = useState<number | null>(
    null
  );
  const [reportPostId, setReportPostId] = useState<number | null>(null);
  const [deletePostId, setDeletePostId] = useState<number | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{ [key: number]: string }>(
    {}
  );
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const currentUserId = userData.id;
  const username = userData.username;
  const userProfilePictureUrl = userData.bio?.profilePictureUrl || "";

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleReactionClick = (postReactions: any[]) => {
    setCurrentPostReactions(postReactions);
    setShowReactionPopup(true);
  };

  const handleCommentsClick = (postComments: any[]) => {
    setCurrentPostComments(postComments);
    setShowCommentsPopup(true);
  };

  const handleCommentClick = (postId: number) => {
    setShowCommentsPopup(false);
    setOpenMenuIdComment(openMenuIdComment === postId ? null : postId);
  };

  const handleDeleteClick = (postId: number) => {
    setDeletePostId(postId);
    setOpenMenuId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletePostId || isDeletingPost) return;

    setIsDeletingPost(true);

    try {
      await axios.delete(`http://localhost:8080/api/posts/${deletePostId}`);
      setPosts((prevPosts) =>
        prevPosts.filter((post) => post.id !== deletePostId)
      );
      setOpenMenuId(null);
      setDeletePostId(null);
      window.dispatchEvent(
        new CustomEvent("profile-stats-refresh", {
          detail: { userId: currentUserId },
        })
      );
    } catch (error) {
      console.error("Error deleting post:", error);
    } finally {
      setIsDeletingPost(false);
    }
  };

  const handleReport = (postId: number) => {
    setReportPostId(postId);
    setOpenMenuId(null);
  };

  // Profil i pocetna stranica koriste isti endpoint za cuvanje prijave.
  const handleReportSubmit = async (reason: string) => {
    if (!reportPostId) throw new Error("Select a post first");
    await reportPost(reportPostId, reason);
  };

  const handleAddComment = async (postId: number) => {
    const content = commentInputs[postId];

    if (!content?.trim()) return;

    try {
      await axios.post(
        `http://localhost:8080/api/comments/${postId}?userId=${currentUserId}`,
        { content }
      );

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: [
                  ...post.comments,
                  {
                    userID: currentUserId,
                    username,
                    content,
                    userProfilePictureUrl,
                  },
                ],
              }
            : post
        )
      );

      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleLike = async (postId: number) => {
    const post = posts.find((item) => item.id === postId);
    if (!post) return;

    const existingReaction = post.reactions.find(
      (reaction) => reaction.userID === currentUserId || reaction.userId === currentUserId
    );

    try {
      let updatedReactions = [...post.reactions];

      if (existingReaction) {
        updatedReactions = updatedReactions.filter(
          (reaction) => reaction.id !== existingReaction.id
        );

        await axios.delete(
          `http://localhost:8080/api/reactions/remove?reactionId=${existingReaction.id}`
        );
      } else {
        updatedReactions = [
          ...updatedReactions,
          {
            userID: currentUserId,
            username,
            type: "LIKE",
            userProfilePictureUrl,
          },
        ];

        await axios.post("http://localhost:8080/api/reactions/add", {
          type: "LIKE",
          userId: currentUserId,
          postId,
        });
      }

      setPosts((prevPosts) =>
        prevPosts.map((item) =>
          item.id === postId ? { ...item, reactions: updatedReactions } : item
        )
      );
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  return (
    <div className="all-posts-container">
      {posts.length === 0 ? (
        <p className="profile-empty-posts">No posts available for this user.</p>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="container-post">
            <div className="post-body">
              <div className="user-info-post">
                <div className="user-post">
                  <img
                    src={post.userProfilePictureUrl || post.userProfilePic || DEFAULT_PROFILE_PICTURE_URL}
                    className="user-profile-pic-post"
                    alt=""
                  />
                  <h2 className="h2-post">{post.user}</h2>
                </div>
                <div className="relative">
                  <div
                    onClick={() =>
                      setOpenMenuId(openMenuId === post.id ? null : post.id)
                    }
                    className="cursor-pointer"
                  >
                    <FontAwesomeIcon
                      icon={faEllipsisV}
                      className="fa-ellipsis-v"
                    />
                  </div>

                  {openMenuId === post.id && (
                    <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-lg z-10">
                      {currentUserId === post.userId ? (
                        <button
                          className="buttonOptions"
                          onClick={() => handleDeleteClick(post.id)}
                        >
                          Delete
                        </button>
                      ) : (
                        <button
                          className="buttonOptions"
                          onClick={() => handleReport(post.id)}
                        >
                          Report
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="date-tags-container">
                <div className="date-time-post">
                  {formatDate(post.creationDate)}
                  <span>
                    {" "}
                    <FontAwesomeIcon icon={faEarth} className="fas fa-earth" />
                  </span>
                </div>
                {post.tags && post.tags.length > 0 && (
                  <div className="tags-container">
                    {post.tags.map((tag, tagIndex) => (
                      <span key={tagIndex} className="tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="description-post">{post.content}</div>
              <div className="post-detail">
                {post.mediaUrl && (
                  <div className="upload-img-container">
                    <img src={post.mediaUrl} className="upload-img" alt="" />
                  </div>
                )}
                <div className="reaction-comment-preview">
                  <div
                    className="reaction-preview"
                    onClick={() => handleReactionClick(post.reactions)}
                  >
                    <span>
                      <FontAwesomeIcon
                        icon={faThumbsUp}
                        className="fas fa-thumbs-up"
                      />
                    </span>
                    <span>
                      <FontAwesomeIcon
                        icon={faHeart}
                        className="fas fa-heart"
                      />
                    </span>
                    <span className="count-reaction">
                      {post.reactions.length}
                    </span>
                  </div>
                  <div className="comment-share-preview">
                    <span
                      className="click-comments"
                      onClick={() => handleCommentsClick(post.comments)}
                    >
                      {post.comments.length} comments{" "}
                    </span>
                  </div>
                </div>
                <div className="reactions-comment-share-icons">
                  <div
                    className="reaction"
                    tabIndex={1}
                    onClick={() => handleLike(post.id)}
                  >
                    <span>
                      <FontAwesomeIcon
                        icon={faThumbsUp}
                        className="fas fa-thumbs-up"
                      />
                    </span>
                    <i>
                      {post.reactions.some(
                        (reaction) =>
                          (reaction.userID === currentUserId ||
                            reaction.userId === currentUserId) &&
                          reaction.type === "LIKE"
                      )
                        ? "Liked"
                        : "Like"}
                    </i>
                  </div>
                  <div
                    className="comment"
                    onClick={() => handleCommentClick(post.id)}
                  >
                    <span>
                      <FontAwesomeIcon
                        icon={faCommentAlt}
                        className="far fa-comment"
                      />
                    </span>
                    <i>Comment</i>
                  </div>
                </div>
              </div>
              {openMenuIdComment === post.id && (
                <div className="comment-input-container">
                  <input
                    type="text"
                    className="comment-input"
                    placeholder="Write a comment..."
                    value={commentInputs[post.id] || ""}
                    onChange={(e) =>
                      setCommentInputs({
                        ...commentInputs,
                        [post.id]: e.target.value,
                      })
                    }
                  />
                  <button
                    className="comment-submit"
                    onClick={() => handleAddComment(post.id)}
                  >
                    Comment
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      )}
      {showCommentsPopup && (
        <CommentPopup
          comments={currentPostComments}
          onClose={() => setShowCommentsPopup(false)}
        />
      )}

      {showReactionPopup && (
        <ReactionPopup
          reactions={currentPostReactions}
          onClose={() => setShowReactionPopup(false)}
        />
      )}

      {reportPostId && (
        <ReportPostModal
          onClose={() => setReportPostId(null)}
          onSubmit={handleReportSubmit}
        />
      )}

      {deletePostId && (
        <DeletePostModal
          isDeleting={isDeletingPost}
          onClose={() => setDeletePostId(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
};

export default UserPosts;
