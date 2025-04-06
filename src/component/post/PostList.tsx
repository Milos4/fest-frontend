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
  userId: number;
  userProfilePic: string;
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
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [openMenuIdComment, setOpenMenuIdComment] = useState<number | null>(
    null
  );
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const currentUserId = userData.id;
  const username = userData.username;
  const [commentInputs, setCommentInputs] = useState<{ [key: number]: string }>(
    {}
  );

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

  const handleCommentClick = (postId: number) => {
    setShowCommentsPopup(false);
    setOpenMenuIdComment(openMenuIdComment === postId ? null : postId);
  };

  const handleDelete = async (postId: number) => {
    try {
      await axios.delete(`http://localhost:8080/api/posts/${postId}`);
      setPosts(posts.filter((post) => post.id == postId));
      setOpenMenuId(null);
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleReport = (postId: number) => {
    console.log(`Post ${postId} reported! by ${currentUserId}`);
    setOpenMenuId(null);
  };

  const handleAddComment = async (postId: number) => {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const userID = userData.id;
    const content = commentInputs[postId]; // Preuzimamo tekst iz input polja

    if (!content.trim()) return; // Sprečavamo slanje praznog komentara

    try {
      // Pošaljemo zahtev sa postId i userId kao parametre i content kao telo zahteva
      const response = await axios.post(
        `http://localhost:8080/api/comments/${postId}?userId=${userID}`, // Dodajemo userId u URL kao query parametar
        {
          content, // Sadržaj komentara
        }
      );

      console.log("Komentar uspešno dodat:", response.data);

      // Ažuriraj postove sa novim komentarom
      setPosts(
        posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: [...post.comments, { userID, username, content }],
              }
            : post
        )
      );

      // Resetuj input polje za komentar
      setCommentInputs({ ...commentInputs, [postId]: "" });
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleLike = async (postId: number) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    // Proveravamo da li je korisnik već lajkovao post
    const existingReaction = post.reactions.find(
      (reaction) => reaction.userID === currentUserId
    );

    try {
      let updatedReactions = [...post.reactions];

      if (existingReaction) {
        updatedReactions = updatedReactions.filter(
          (reaction) => reaction.id !== existingReaction.id
        );

        // API poziv za uklanjanje reakcije
        await axios.delete(
          `http://localhost:8080/api/reactions/remove?reactionId=${existingReaction.id}`
        );
      } else {
        // Dodajemo novu reakciju
        updatedReactions = [
          ...updatedReactions,
          { userID: currentUserId, username, type: "LIKE" },
        ];

        console.log();

        // API poziv za dodavanje reakcije
        await axios.post("http://localhost:8080/api/reactions/add", {
          type: "LIKE",
          userId: currentUserId,
          postId: postId,
        });
      }
      setPosts(
        posts.map((p) =>
          p.id === postId ? { ...p, reactions: updatedReactions } : p
        )
      );
    } catch (error) {
      console.error("Error updating like:", error);
    }
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
                        {currentUserId === post.user ? (
                          <button
                            className="buttonOptions"
                            onClick={() => handleDelete(post.id)}
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
                            reaction.userID === currentUserId &&
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
                      Post
                    </button>
                  </div>
                )}
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
