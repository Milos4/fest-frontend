import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "./styleSideBar.css";

import userImg from "../../images/user.png";
import verifiedImg from "../../images/verified.png";
import eventsImg from "../../images/events.png";
import clubEventsImg from "../../images/club-events.png";
import ratingImg from "../../images/rating.png";
import followersImg from "../../images/followers.png";
import locationImg from "../../images/location.png";
import videoChatImg from "../../images/video-chat.png";
import myClub from "../../images/my-club.png";
import home from "../../images/home.png";

import logoutImg from "../../images/logout.png";

const SideBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  // Add a class to the sidebar if it's the profile page to extend side bar 100%
  const isProfilePage = location.pathname.startsWith("/profile/");
  const sidebarClass = isProfilePage ? "profile-page-sidebar" : "";

  useEffect(() => {
    // Check if user data exists in local storage
    const userDataStr = localStorage.getItem("userData");
    if (userDataStr) {
      // Parse the stored JSON string to extract username and email
      const userData = JSON.parse(userDataStr);
      // Set username and email in state
      setUsername(userData.username);
      setEmail(userData.email);
    }
  }, []);

  //Sidebar nav
  const handleHomeClick = () => {
    navigate("/home");
  };

  const handleLogout = () => {
    localStorage.clear(); // Briše sve iz localStorage-a
    sessionStorage.clear(); // Briše sve iz sessionStorage-a
    window.location.href = "/"; // Vraća korisnika na početnu stranicu
  };

  return (
    <nav className="sidebar">
      <div className={`side-nav ${sidebarClass}`}>
        <div className="user">
          <img src={userImg} className="user-img" alt="User" />
          <div>
            <h2>{username}</h2>
            <p>{email}</p>
          </div>
          <img src={verifiedImg} className="verified-img" alt="Verified" />
        </div>
        <ul>
          {isProfilePage && (
            <li>
              <img src={home} alt="Home" onClick={handleHomeClick} />
              <p onClick={handleHomeClick}>Home</p>
            </li>
          )}

          <li>
            <img src={eventsImg} alt="Events" />
            <p>Events</p>
          </li>
          <li>
            <img src={clubEventsImg} alt="Clubs Events" />
            <p>Clubs Event</p>
          </li>
          <li>
            <img src={locationImg} alt="Location" />
            <p>Location</p>
          </li>
          <li>
            <img src={followersImg} alt="Followers" />
            <p>Followers</p>
          </li>
          <li>
            <img src={videoChatImg} alt="Video Chat" />
            <p>Video Chat</p>
          </li>
          <li>
            <img src={ratingImg} alt="Rating" />
            <p>Rating</p>
          </li>
          <li>
            <img src={myClub} alt="Club" />
            <p>My Club</p>
          </li>
        </ul>
        <ul>
          <li onClick={handleLogout}>
            <img src={logoutImg} alt="Logout" />
            <p>Logout</p>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default SideBar;
