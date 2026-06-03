import React, { useState, useEffect } from "react";
import axios from "axios";
import { collection, getDocs, query, updateDoc, where } from "firebase/firestore";
import logoImg from "../../images/logo.png";
import "./myProfile.css";
import { IonIcon } from "@ionic/react";
import {
  createOutline,
  closeOutline,
  imageOutline,
  lockClosedOutline,
  globeOutline,
} from "ionicons/icons";
import { db, uploadProfileImage } from "../../firebase";
import { getInstagramDisplayName } from "../../utils/instagram";

interface BioData {
  firstName: string;
  lastName: string;
  location: string;
  interests: string[];
  dateOfBirth: string;
  instagramProfileUrl: string;
  preferredLanguage: string;
  profilePictureUrl: string;
  privateProfile: boolean;
}

interface ProfileData {
  username: string;
  bio?: Partial<BioData>;
}

interface EditProfileFormData {
  firstName: string;
  lastName: string;
  location: string;
  interests: string;
  dateOfBirth: string;
  instagramProfileUrl: string;
  preferredLanguage: string;
  profilePictureUrl: string;
  isPrivate: boolean;
}

const emptyForm: EditProfileFormData = {
  firstName: "",
  lastName: "",
  location: "",
  interests: "",
  dateOfBirth: "",
  instagramProfileUrl: "",
  preferredLanguage: "",
  profilePictureUrl: "",
  isPrivate: false,
};

const cityOptions = [
  "Sarajevo",
  "Banja Luka",
  "Tuzla",
  "Zenica",
  "Mostar",
  "Bihac",
  "Brcko",
  "Trebinje",
  "Doboj",
  "Prijedor",
  "Beograd",
  "Novi Sad",
  "Nis",
  "Kragujevac",
  "Podgorica",
  "Niksic",
  "Zagreb",
  "Split",
  "Rijeka",
  "Osijek",
  "Ljubljana",
  "Maribor",
];

const MyProfile: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [editForm, setEditForm] = useState<EditProfileFormData>(emptyForm);

  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const userId = userData.id;

  const syncProfilePictureInChats = async (profilePictureUrl: string) => {
    if (!userId) {
      return;
    }

    try {
      const chatsQuery = query(
        collection(db, "chats"),
        where("participants", "array-contains", Number(userId))
      );
      const snapshot = await getDocs(chatsQuery);

      await Promise.all(
        snapshot.docs.map((chatDoc) =>
          updateDoc(chatDoc.ref, {
            [`participantProfilePictures.${userId}`]: profilePictureUrl,
          })
        )
      );
    } catch (error) {
      console.error("Error syncing profile picture in chats:", error);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8080/api/users/${userId}`
        );
        setProfile(response.data);
      } catch (err) {
        setError("Error fetching profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleOpenEdit = () => {
    if (!profile) {
      return;
    }

    setSaveMessage("");
    setSaveError("");
    setEditForm({
      firstName: profile.bio?.firstName || "",
      lastName: profile.bio?.lastName || "",
      location: profile.bio?.location || "",
      interests: profile.bio?.interests?.join(", ") || "",
      dateOfBirth: profile.bio?.dateOfBirth || "",
      instagramProfileUrl: profile.bio?.instagramProfileUrl || "",
      preferredLanguage: profile.bio?.preferredLanguage || "",
      profilePictureUrl: profile.bio?.profilePictureUrl || "",
      isPrivate: Boolean(profile.bio?.privateProfile),
    });
    setIsEditOpen(true);
  };

  const handleCloseEdit = () => {
    if (isSaving || isUploadingImage) {
      return;
    }

    setSaveError("");
    setIsEditOpen(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!userId) {
      setSaveError("User is not logged in.");
      return;
    }

    setSaveError("");
    setIsUploadingImage(true);

    try {
      const imageUrl = await uploadProfileImage(userId, file);
      setEditForm((prev) => ({
        ...prev,
        profilePictureUrl: imageUrl,
      }));
    } catch (err) {
      setSaveError("Image upload failed. Try again.");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveError("");
    setSaveMessage("");

    if (!userId) {
      setSaveError("User is not logged in.");
      return;
    }

    const payload = {
      firstName: editForm.firstName.trim(),
      lastName: editForm.lastName.trim(),
      location: editForm.location.trim(),
      interests: editForm.interests
        .split(",")
        .map((interest) => interest.trim())
        .filter(Boolean),
      dateOfBirth: editForm.dateOfBirth,
      instagramProfileUrl: editForm.instagramProfileUrl.trim(),
      preferredLanguage: editForm.preferredLanguage.trim(),
      profilePictureUrl: editForm.profilePictureUrl.trim(),
      privateProfile: editForm.isPrivate,
    };

    setIsSaving(true);

    try {
      const response = await axios.put(
        `http://localhost:8080/api/users/${userId}/profile`,
        payload
      );

      setProfile(response.data);
      const nextProfilePictureUrl =
        response.data?.bio?.profilePictureUrl || payload.profilePictureUrl;
      const nextUserData = {
        ...userData,
        bio: {
          ...(userData.bio || {}),
          ...(response.data?.bio || {}),
          profilePictureUrl: nextProfilePictureUrl,
        },
      };

      localStorage.setItem("userData", JSON.stringify(nextUserData));
      window.dispatchEvent(
        new CustomEvent("profile-updated", {
          detail: {
            userId,
            profilePictureUrl: nextProfilePictureUrl,
            userData: response.data,
          },
        })
      );
      await syncProfilePictureInChats(nextProfilePictureUrl);
      setSaveMessage("Profile changes saved successfully.");
      setIsEditOpen(false);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setSaveError(
          typeof err.response?.data === "string"
            ? err.response.data
            : "Failed to save profile changes."
        );
      } else {
        setSaveError("Failed to save profile changes.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const interests = profile?.bio?.interests || [];
  const profileImagePreview =
    editForm.profilePictureUrl || profile?.bio?.profilePictureUrl || logoImg;
  const isPrivate = Boolean(profile?.bio?.privateProfile);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <>
      <div className="myprofile-container">
        <div className="myprofile-card">
          <div className="edit-button-container">
            <button className="edit-button" onClick={handleOpenEdit}>
              <span className="icon">
                <IonIcon icon={createOutline} />
              </span>
            </button>
          </div>
          <div className="myprofile-header">
            <div className="myprofile-picture-container">
              <img
                src={profile?.bio?.profilePictureUrl || logoImg}
                alt="Profile"
                className="myprofile-picture"
              />
            </div>
            <h1 className="myprofile-username">{profile?.username}</h1>
            <div
              className={`myprofile-privacy-badge ${
                isPrivate ? "private" : "public"
              }`}
            >
              <IonIcon icon={isPrivate ? lockClosedOutline : globeOutline} />
              <span>{isPrivate ? "Private Profile" : "Public Profile"}</span>
            </div>
            <h2 className="myprofile-name">
              {profile?.bio?.firstName || "No first name available"}{" "}
              {profile?.bio?.lastName || "No last name available"}
            </h2>
          </div>
          <div className="myprofile-bio-section bio-link-profile">
            <h3>Bio</h3>
            <div className="myprofile-bio-line"></div>
          </div>
          {saveMessage && (
            <div className="myprofile-save-message">{saveMessage}</div>
          )}
          <div className="myprofile-additional-info">
            <div className="myprofile-info-item">
              <label>Location:</label>
              <span>{profile?.bio?.location || "Location not available"}</span>
            </div>
            <div className="myprofile-info-item">
              <label>Interests:</label>
              <div className="myprofile-interests">
                {interests.length > 0
                  ? interests.map((interest: string, index: number) => (
                      <span key={index} className="myprofile-interest-tag">
                        {interest}
                      </span>
                    ))
                  : "No interests listed."}
              </div>
            </div>
            <div className="myprofile-info-item">
              <label>Date of Birth:</label>
              <span>
                {profile?.bio?.dateOfBirth || "Date of birth not available"}
              </span>
            </div>
            <div className="myprofile-info-item">
              <label>Instagram:</label>
              {profile?.bio?.instagramProfileUrl ? (
                <a
                  href={profile.bio.instagramProfileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="myprofile-link"
                >
                  {getInstagramDisplayName(profile.bio.instagramProfileUrl)}
                </a>
              ) : (
                <span>No Instagram profile available</span>
              )}
            </div>
            <div className="myprofile-info-item">
              <label>Preferred Language:</label>
              <span>
                {profile?.bio?.preferredLanguage ||
                  "No preferred language specified."}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isEditOpen && (
        <div className="myprofile-modal-overlay" onClick={handleCloseEdit}>
          <div
            className="myprofile-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="myprofile-modal-header">
              <h2>Edit Profile</h2>
              <button
                type="button"
                className="myprofile-close-button"
                onClick={handleCloseEdit}
                disabled={isSaving || isUploadingImage}
              >
                <IonIcon icon={closeOutline} />
              </button>
            </div>

            <form className="myprofile-edit-form" onSubmit={handleSave}>
              <div className="myprofile-image-upload-section">
                <img
                  src={profileImagePreview}
                  alt="Preview"
                  className="myprofile-edit-preview"
                />
                <label
                  className="myprofile-upload-button"
                  htmlFor="profileImageFile"
                >
                  <IonIcon icon={imageOutline} />
                  <span>
                    {isUploadingImage ? "Uploading..." : "Choose From Computer"}
                  </span>
                </label>
                <input
                  id="profileImageFile"
                  type="file"
                  accept="image/*"
                  className="myprofile-file-input"
                  onChange={handleProfileImageSelect}
                  disabled={isSaving || isUploadingImage}
                />
              </div>

              <div className="myprofile-form-grid">
                <div className="myprofile-form-field">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    id="firstName"
                    name="firstName"
                    value={editForm.firstName}
                    onChange={handleChange}
                    disabled={isSaving || isUploadingImage}
                  />
                </div>

                <div className="myprofile-form-field">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    id="lastName"
                    name="lastName"
                    value={editForm.lastName}
                    onChange={handleChange}
                    disabled={isSaving || isUploadingImage}
                  />
                </div>

                <div className="myprofile-form-field">
                  <label htmlFor="location">Location</label>
                  <input
                    id="location"
                    name="location"
                    list="city-options"
                    value={editForm.location}
                    onChange={handleChange}
                    disabled={isSaving || isUploadingImage}
                    placeholder="Choose or type a city"
                  />
                  <datalist id="city-options">
                    {cityOptions.map((city) => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                </div>

                <div className="myprofile-form-field">
                  <label htmlFor="preferredLanguage">Preferred Language</label>
                  <input
                    id="preferredLanguage"
                    name="preferredLanguage"
                    value={editForm.preferredLanguage}
                    onChange={handleChange}
                    disabled={isSaving || isUploadingImage}
                  />
                </div>

                <div className="myprofile-form-field">
                  <label>Profile Privacy</label>
                  <button
                    type="button"
                    className={`myprofile-toggle ${
                      editForm.isPrivate ? "active" : ""
                    }`}
                    onClick={() =>
                      setEditForm((prev) => ({
                        ...prev,
                        isPrivate: !prev.isPrivate,
                      }))
                    }
                    disabled={isSaving || isUploadingImage}
                  >
                    <span className="myprofile-toggle-track">
                      <span className="myprofile-toggle-thumb"></span>
                    </span>
                    <span className="myprofile-toggle-label">
                      {editForm.isPrivate ? "Private" : "Public"}
                    </span>
                  </button>
                </div>

                <div className="myprofile-form-field">
                  <label htmlFor="dateOfBirth">Date of Birth</label>
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={editForm.dateOfBirth}
                    onChange={handleChange}
                    disabled={isSaving || isUploadingImage}
                  />
                </div>

                <div className="myprofile-form-field">
                  <label htmlFor="instagramProfileUrl">Instagram</label>
                  <input
                    id="instagramProfileUrl"
                    name="instagramProfileUrl"
                    value={editForm.instagramProfileUrl}
                    onChange={handleChange}
                    disabled={isSaving || isUploadingImage}
                  />
                </div>
              </div>

              <div className="myprofile-form-field">
                <label htmlFor="interests">Interests</label>
                <textarea
                  id="interests"
                  name="interests"
                  rows={3}
                  value={editForm.interests}
                  onChange={handleChange}
                  placeholder="music, festivals, nightlife"
                  disabled={isSaving || isUploadingImage}
                />
              </div>

              {saveError && (
                <div className="myprofile-error-message">{saveError}</div>
              )}

              <div className="myprofile-form-actions">
                <button
                  type="button"
                  className="myprofile-cancel-button"
                  onClick={handleCloseEdit}
                  disabled={isSaving || isUploadingImage}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="myprofile-save-button"
                  disabled={isSaving || isUploadingImage}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default MyProfile;
