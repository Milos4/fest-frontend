import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faCalendarDays,
  faCalendarPlus,
  faCalendarCheck,
  faUser,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";

import "./styleSideBar.css";

import { DEFAULT_PROFILE_PICTURE_URL } from "../../utils/profilePicture";
import { HomeView } from "../events/eventTypes";

interface SideBarProps {
  onSelectHomeView?: (view: HomeView) => void;
  activeHomeView?: HomeView;
  withTopNav?: boolean;
}

const SideBar: React.FC<SideBarProps> = ({
  onSelectHomeView,
  activeHomeView,
  withTopNav = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === "/home";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState("");

  useEffect(() => {
    const userDataStr = localStorage.getItem("userData");
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      setUsername(userData.username);
      setEmail(userData.email);
      setUserId(userData.id);
      setProfilePictureUrl(userData.bio?.profilePictureUrl || "");
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const fetchProfilePicture = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/users/${userId}`);
        if (!response.ok) return;

        const profile = await response.json();
        const nextProfilePictureUrl = profile.bio?.profilePictureUrl || "";
        setProfilePictureUrl(nextProfilePictureUrl);

        const userDataStr = localStorage.getItem("userData");
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          localStorage.setItem(
            "userData",
            JSON.stringify({
              ...userData,
              bio: {
                ...(userData.bio || {}),
                ...(profile.bio || {}),
                profilePictureUrl: nextProfilePictureUrl,
              },
            })
          );
        }
      } catch (error) {
        console.error("Error fetching sidebar profile picture:", error);
      }
    };

    fetchProfilePicture();
  }, [userId]);

  useEffect(() => {
    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{
        userId?: number;
        profilePictureUrl?: string;
      }>;

      if (
        customEvent.detail?.userId &&
        String(customEvent.detail.userId) !== String(userId)
      ) {
        return;
      }

      setProfilePictureUrl(customEvent.detail?.profilePictureUrl || "");
    };

    window.addEventListener("profile-updated", handleProfileUpdated);

    return () => {
      window.removeEventListener("profile-updated", handleProfileUpdated);
    };
  }, [userId]);

  // Odjava mora ukinuti i serversku sesiju, ne samo lokalne podatke.
  const handleLogout = async () => {
    try { await (await import("../../api")).logout(); }
    catch { alert("Logout failed. Please try again."); }
  };

  const handleHomeViewClick = (view: HomeView) => {
    if (isHomePage && onSelectHomeView) {
      onSelectHomeView(view);
      return;
    }

    navigate("/home", { state: { homeView: view } });
  };

  const menuItems = [
    {
      label: "Home",
      icon: faHouse,
      view: "feed" as HomeView,
      onClick: () => handleHomeViewClick("feed"),
    },
    {
      label: "Events",
      icon: faCalendarDays,
      view: "events" as HomeView,
      onClick: () => handleHomeViewClick("events"),
    },
    {
      label: "Create Event",
      icon: faCalendarPlus,
      view: "create-event" as HomeView,
      onClick: () => handleHomeViewClick("create-event"),
    },
    {
      label: "My Events",
      icon: faCalendarCheck,
      view: "my-events" as HomeView,
      onClick: () => handleHomeViewClick("my-events"),
    },
    {
      label: "My Profile",
      icon: faUser,
      view: "my-profile" as HomeView,
      onClick: () => handleHomeViewClick("my-profile"),
    },
  ];

  return (
    <nav className="sidebar">
      <div
        className={`side-nav ${!isHomePage && !withTopNav ? "side-nav-full" : ""}`}
      >
        <div className="sidebar-main">
          <div className="user">
            <img
              src={profilePictureUrl || DEFAULT_PROFILE_PICTURE_URL}
              className="user-img"
              alt="User"
            />
            <div>
              <h2>{username}</h2>
              <p>{email}</p>
            </div>
          </div>

          <ul className="sidebar-menu">
            {menuItems.map((item) => (
              <li
                key={item.label}
                onClick={item.onClick}
                className={
                  item.view && activeHomeView === item.view ? "active" : ""
                }
              >
                <FontAwesomeIcon icon={item.icon} className="sidebar-icon" />
                <p>{item.label}</p>
              </li>
            ))}
          </ul>
        </div>

        <ul className="sidebar-logout">
          <li onClick={handleLogout}>
            <FontAwesomeIcon icon={faRightFromBracket} className="sidebar-icon" />
            <p>Logout</p>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default SideBar;
