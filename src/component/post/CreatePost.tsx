import React, { useState } from "react";
import "./createPost.css";

interface PostDTO {
  content: string;
  mediaUrl: string;
  tags: string[];
  userId: number;
}

const CreatePost: React.FC = () => {
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const userId = userData.id;

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handlePost = async () => {
    const newPost: PostDTO = {
      content,
      mediaUrl,
      tags,
      userId,
    };

    try {
      const response = await fetch("http://localhost:8080/api/posts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPost),
      });

      if (response.ok) {
        const createdPost = await response.json();
        console.log("Post created successfully:", createdPost);
        setContent("");
        setMediaUrl("");
        setTags([]);
      } else {
        console.error("Failed to create post:", response.statusText);
      }
    } catch (error) {
      console.error("Error while creating post:", error);
    }
  };

  return (
    <div className="create-post-container">
      <div className="create-post">
        <textarea
          className="create-post-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
        ></textarea>

        <div className="media-upload-container">
          <input
            type="text"
            className="media-url-input"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="Paste image or video URL here"
          />
        </div>

        <div className="tags-input-container">
          <input
            type="text"
            className="tag-input"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="Add tags (Press Enter)"
          />
          <div className="tags-display">
            {tags.map((tag, index) => (
              <span key={index} className="tag">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="create-post-actions">
          <button className="post-button" onClick={handlePost}>
            Post
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
