import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./postlist.css";
import logoImg from "../../images/logo.png";
import naruto from "../../images/Naruto.jpg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faEllipsisV,
  faEarth,
  faShare,
} from "@fortawesome/free-solid-svg-icons";
import { faCommentAlt, faThumbsUp } from "@fortawesome/free-regular-svg-icons";
import ReactionPopup from "../reaction/ReactionPopup";
import CommentPopup from "../comment/CommentPopup";

interface Post {
  id: number;
  content: string;
  mediaUrl: string;
  user: string;
  userId: number;
  userProfilePic: string;
  reactions: any[];
  comments: any[];
  creationDate: string;
  tags: string[];
}

const UserPosts: React.FC = () => {
  const { userId } = useParams<{ userId: string }>(); // Get the userId from URL params
  const [posts, setPosts] = useState<Post[]>([]);

  const [showReactionPopup, setShowReactionPopup] = useState<boolean>(false);
  const [currentPostReactions, setCurrentPostReactions] = useState<any[]>([]);
  const [showCommentsPopup, setShowCommentsPopup] = useState<boolean>(false);
  const [currentPostComments, setCurrentPostComments] = useState<any[]>([]);

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const currentUserId = userData.id;

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get<Post[]>(
          `http://localhost:8080/api/posts/${userId}` // Fetch posts for specific user
        );
        setPosts(response.data);
      } catch (error) {
        console.error("Error fetching posts for user:", error);
      }
    };

    if (userId) {
      fetchPosts(); // Fetch posts only if userId exists
    }
  }, [userId]);

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

  const handleDelete = async (postId: number, userId: number) => {
    try {
      await axios.delete(`http://localhost:8080/api/posts/${postId}`, {
        params: { userId },
      });
      setPosts(posts.filter((post) => post.id !== postId));
      setOpenMenuId(null);
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleReport = (postId: number) => {
    console.log(`Post ${postId} reported! by ${currentUserId}`);
    setOpenMenuId(null);
  };

  return (
    <div className="all-posts-container">
      {posts.length === 0 ? (
        <p>No posts available for this user.</p>
      ) : (
        posts.map((post, index) => (
          <div key={index} className="container-post">
            <div className="post-body">
              <div className="user-info-post">
                <div className="user-post">
                  <img src={logoImg} className="user-profile-pic-post" alt="" />
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
                          onClick={() => handleDelete(post.id, currentUserId)}
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
                {/* Tags Section */}
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
                    <img src={naruto} className="upload-img" alt="" />
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
                    <span>2.5k share </span>
                  </div>
                </div>
                <div className="reactions-comment-share-icons">
                  <div className="reaction" tabIndex={1}>
                    <span>
                      <FontAwesomeIcon
                        icon={faThumbsUp}
                        className="fas fa-thumbs-up"
                      />
                    </span>
                    <i>Like</i>
                  </div>
                  <div className="comment">
                    <span>
                      <FontAwesomeIcon
                        icon={faCommentAlt}
                        className="far fa-comment"
                      />
                    </span>
                    <i>Comment</i>
                  </div>
                  <div className="share">
                    <span>
                      <FontAwesomeIcon
                        icon={faShare}
                        className="fas fa-share"
                      />
                    </span>
                    <i>Share</i>
                  </div>
                </div>
              </div>
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
    </div>
  );
};

export default UserPosts;
