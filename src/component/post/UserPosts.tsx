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

interface User {
  id: number;
  username: string;
}

interface Post {
  id: number;
  content: string;
  mediaUrl: string;
  user: User;
  reactions: any[];
  comments: any[];
  creationDate: string;
  tags: string[];
}

const UserPosts: React.FC = () => {
  const { userId } = useParams<{ userId: string }>(); // Get the userId from URL params
  const [posts, setPosts] = useState<Post[]>([]);

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
                  <h2 className="h2-post">{post.user.username}</h2>
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
                  <div className="reaction-preview">
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
                    <span>{post.comments.length} comments </span>
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
    </div>
  );
};

export default UserPosts;
