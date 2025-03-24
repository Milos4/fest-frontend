import React, { useState, useEffect } from "react";
import axios from "axios";
import "./postlist.css";
import logoImg from "../../images/logo.png";
import ReactionPopup from "../reaction/ReactionPopup";
import CommentPopup from "../comment/CommentPopup";

import {
  faHeart,
  faEarth,
  faEllipsisV,
  faShare,
} from "@fortawesome/free-solid-svg-icons";
import { faCommentAlt, faThumbsUp } from "@fortawesome/free-regular-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Post {
  id: number;
  content: string;
  mediaUrl: string;
  user: string;
  reactions: any[];
  comments: any[];
  creationDate: string;
  tags: string[];
}

const PostList: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);

  const [showReactionPopup, setShowReactionPopup] = useState<boolean>(false);
  const [currentPostReactions, setCurrentPostReactions] = useState<any[]>([]);
  const [showCommentsPopup, setShowCommentsPopup] = useState<boolean>(false);
  const [currentPostComments, setCurrentPostComments] = useState<any[]>([]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const userId = userData.id;
    const fetchPosts = async () => {
      try {
        const response = await axios.get<Post[]>(
          `http://localhost:8080/api/posts/${userId}/followed-posts`
        );
        setPosts(response.data);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    fetchPosts();
  }, []);

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

  return (
    <>
      <div className="all-posts-container">
        {posts.length === 0 ? (
          <div className="no-posts-container">No posts available.</div>
        ) : (
          posts.map((post, index) => (
            <div key={post.id} className="container-post">
              <div className="post-body">
                <div className="user-info-post">
                  <div className="user-post">
                    <img
                      src={logoImg}
                      className="user-profile-pic-post"
                      alt=""
                    />
                    <h2 className="h2-post">{post.user}</h2>
                  </div>
                  <div>
                    <FontAwesomeIcon
                      icon={faEllipsisV}
                      className="fa-ellipsis-v"
                    />
                  </div>
                </div>
                <div className="date-tags-container">
                  <div className="date-time-post">
                    {formatDate(post.creationDate)}
                    <span>
                      {" "}
                      <FontAwesomeIcon
                        icon={faEarth}
                        className="fas fa-earth"
                      />
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
                  <div className="upload-img-container">
                    <img
                      src={post.mediaUrl}
                      // src={naruto}
                      className="upload-img"
                      alt=""
                    />
                  </div>

                  <div className="reaction-comment-preview">
                    <div
                      className="reaction-preview"
                      onClick={() => handleReactionClick(post.reactions)}
                    >
                      <span>
                        {" "}
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
                      <span>{post.reactions.length} shares </span>
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
      </div>

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
    </>
  );
};
export default PostList;
