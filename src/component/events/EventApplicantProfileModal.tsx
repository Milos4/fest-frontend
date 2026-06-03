import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import logoImg from "../../images/logo.png";
import { getInstagramDisplayName } from "../../utils/instagram";

interface EventApplicantProfileModalProps {
  userId: number;
  fallbackUsername?: string;
  onClose: () => void;
}

const EventApplicantProfileModal: React.FC<EventApplicantProfileModalProps> = ({
  userId,
  fallbackUsername,
  onClose,
}) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);

      try {
        const response = await fetch(`http://localhost:8080/api/users/${userId}`);
        if (!response.ok) throw new Error("Failed to fetch applicant profile");

        setProfile(await response.json());
      } catch (error) {
        console.error("Error fetching applicant profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const bio = profile?.bio || {};
  const interests = Array.isArray(bio.interests)
    ? bio.interests
    : typeof bio.interests === "string"
    ? bio.interests
        .split(",")
        .map((interest: string) => interest.trim())
        .filter(Boolean)
    : [];

  const handleViewProfile = () => {
    navigate(`/profile/${userId}`);
    onClose();
  };

  return (
    <div className="event-modal-overlay" onClick={onClose}>
      <div className="applicant-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="applicant-profile-header">
          <button className="event-icon-button" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
          <img src={bio.profilePictureUrl || logoImg} alt={profile?.username} />
          <h3>{profile?.username || fallbackUsername || "Profile"}</h3>
          <p>
            {[bio.firstName, bio.lastName].filter(Boolean).join(" ") ||
              "No name provided"}
          </p>
        </div>

        {isLoading ? (
          <div className="events-empty">Loading profile...</div>
        ) : profile ? (
          <div className="applicant-profile-body">
            <div className="applicant-profile-grid">
              <div>
                <span>Location</span>
                <strong>{bio.location || "Not available"}</strong>
              </div>
              <div>
                <span>Language</span>
                <strong>{bio.preferredLanguage || "Not specified"}</strong>
              </div>
              <div>
                <span>Date of birth</span>
                <strong>{bio.dateOfBirth || "Not available"}</strong>
              </div>
              <div>
                <span>Instagram</span>
                {bio.instagramProfileUrl ? (
                  <a
                    href={bio.instagramProfileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="applicant-profile-link"
                  >
                    {getInstagramDisplayName(bio.instagramProfileUrl)}
                  </a>
                ) : (
                  <strong>Not available</strong>
                )}
              </div>
            </div>

            <div className="applicant-profile-section">
              <span>Interests</span>
              <div className="applicant-interest-list">
                {interests.length > 0 ? (
                  interests.map((interest: string) => (
                    <em key={interest}>{interest}</em>
                  ))
                ) : (
                  <strong>No interests listed.</strong>
                )}
              </div>
            </div>

            <button
              className="event-button applicant-view-profile"
              onClick={handleViewProfile}
            >
              View profile
            </button>
          </div>
        ) : (
          <div className="events-empty">Profile could not be loaded.</div>
        )}
      </div>
    </div>
  );
};

export default EventApplicantProfileModal;
