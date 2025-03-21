import React, { useState, useEffect } from "react";
import axios from "axios";
import logoImg from "../../images/logo.png";
import "./myProfile.css";
import { IonIcon } from "@ionic/react";

import { createOutline } from "ionicons/icons";

const MyProfile: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const userId = userData.id;

    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8080/api/users/${userId}`
        );
        console.log(response.data);
        setProfile(response.data);
      } catch (err) {
        setError("Error fetching profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="myprofile-container">
      <div className="myprofile-card">
        <div className="edit-button-container">
          <button className="edit-button">
            <span className="icon">
              <IonIcon icon={createOutline} />
            </span>
          </button>
        </div>
        <div className="myprofile-header">
          <div className="myprofile-picture-container">
            <img src={logoImg} alt="Profile" className="myprofile-picture" />
          </div>
          <h1 className="myprofile-username">{profile.username}</h1>
          <h2 className="myprofile-name">
            {profile.bio?.firstName || "No first name available"}{" "}
            {profile.bio?.lastName || "No last name available"}
          </h2>
        </div>
        <div className="myprofile-bio-section bio-link-profile">
          <h3>Bio</h3>
          <div className="myprofile-bio-line "></div>
        </div>
        <div className="myprofile-additional-info">
          <div className="myprofile-info-item">
            <label>Location:</label>
            <span>{profile.bio?.location || "Location not available"}</span>
          </div>
          <div className="myprofile-info-item">
            <label>Interests:</label>
            <div className="myprofile-interests">
              {profile.bio?.interests && profile.bio.interests.length > 0
                ? profile.bio.interests.map(
                    (interest: string, index: number) => (
                      <span key={index} className="myprofile-interest-tag">
                        {interest}
                      </span>
                    )
                  )
                : "No interests listed."}
            </div>
          </div>
          <div className="myprofile-info-item">
            <label>Date of Birth:</label>
            <span>
              {profile.bio?.dateOfBirth || "Date of birth not available"}
            </span>
          </div>
          <div className="myprofile-info-item">
            <label>Instagram:</label>
            <span>
              {profile.bio?.instagramProfileUrl ||
                "No Instagram profile available"}
            </span>
          </div>
          <div className="myprofile-info-item">
            <label>Preferred Language:</label>
            <span>
              {profile.bio?.preferredLanguage ||
                "No preferred language specified."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
