import React, { useState } from "react";
import "./createPost.css";
import { uploadPostMedia } from "../../firebase";
import { IonIcon } from "@ionic/react";
import { imageOutline, closeOutline } from "ionicons/icons";

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
  const [isUploading, setIsUploading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const userId = userData.id;

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!userId) {
      setErrorMessage("User is not logged in.");
      return;
    }

    setErrorMessage("");
    setIsUploading(true);

    try {
      const downloadUrl = await uploadPostMedia(userId, file);
      setMediaUrl(downloadUrl);
    } catch (error) {
      setErrorMessage("Image upload failed. Try again.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handlePost = async () => {
    setErrorMessage("");

    if (!content.trim() && !mediaUrl) {
      setErrorMessage("Write something or add an image before posting.");
      return;
    }

    const newPost: PostDTO = {
      content: content.trim(),
      mediaUrl,
      tags,
      userId,
    };

    setIsPosting(true);

    try {
      const response = await fetch("http://localhost:8080/api/posts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPost),
      });

      if (response.ok) {
        await response.json();
        setContent("");
        setMediaUrl("");
        setTags([]);
        setTagInput("");
        window.dispatchEvent(
          new CustomEvent("profile-stats-refresh", {
            detail: { userId },
          })
        );
      } else {
        setErrorMessage("Failed to create post.");
      }
    } catch (error) {
      setErrorMessage("Error while creating post.");
    } finally {
      setIsPosting(false);
    }
  };

  const isBusy = isUploading || isPosting;

  return (
    <div className="create-post-container">
      <div className="create-post">
        <div className="create-post-header">
          <div>
            <h3>Create Post</h3>
            <p>Share a moment from your festival world.</p>
          </div>
        </div>

        <textarea
          className="create-post-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          disabled={isBusy}
        ></textarea>

        {mediaUrl && (
          <div className="media-preview">
            <img src={mediaUrl} alt="Post preview" />
            <button
              type="button"
              className="remove-media-button"
              onClick={() => setMediaUrl("")}
              disabled={isBusy}
            >
              <IonIcon icon={closeOutline} />
            </button>
          </div>
        )}

        <div className="create-post-toolbar">
          <label className="media-picker-button" htmlFor="postMediaFile">
            <IonIcon icon={imageOutline} />
            <span>{isUploading ? "Uploading..." : "Add Image"}</span>
          </label>
          <input
            id="postMediaFile"
            type="file"
            accept="image/*"
            className="media-file-input"
            onChange={handleMediaSelect}
            disabled={isBusy}
          />

          <div className="tags-input-container">
            <input
              type="text"
              className="tag-input"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Add tag and press Enter"
              disabled={isBusy}
            />
          </div>
        </div>

        {tags.length > 0 && (
          <div className="tags-display">
            {tags.map((tag, index) => (
              <span key={index} className="tag">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {errorMessage && <div className="create-post-error">{errorMessage}</div>}

        <div className="create-post-actions">
          <button className="post-button" onClick={handlePost} disabled={isBusy}>
            {isPosting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
