import React, { useState, useEffect } from "react";
import axios from "axios";
import { IonIcon } from "@ionic/react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import {
  homeOutline,
  personOutline,
  chatboxOutline,
  notificationsOutline,
  settingsOutline,
  searchOutline,
} from "ionicons/icons";
import logoImg from "../../images/logo.png";
import { DEFAULT_PROFILE_PICTURE_URL } from "../../utils/profilePicture";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";

interface NavbarProps {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeIndex, setActiveIndex }) => {
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleItemClick = (
    event: React.MouseEvent<HTMLLIElement>,
    index: number
  ) => {
    event.preventDefault();
    setActiveIndex(index);

    if (index === 3) {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      const userId = userData.id;

      if (!userId) return;

      try {
        const response = await fetch(
          `http://localhost:8080/api/notifications/unread-count?userId=${userId}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setUnreadCount(data.count);
      } catch (error) {
        console.error("Error fetching unread notifications:", error);
      }
    };

    fetchUnreadNotifications();
  }, []);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const userId = Number(userData.id);

    if (!userId) return;

    const chatsQuery = query(
      collection(db, "chats"),
      where("participants", "array-contains", userId)
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const nextUnreadCount = snapshot.docs.filter((chatDoc) => {
        const chat = chatDoc.data();
        return Boolean(chat.unreadBy?.[String(userId)]);
      }).length;

      setUnreadMessagesCount(nextUnreadCount);
    });

    return unsubscribe;
  }, []);

  const handleSearch = async () => {
    try {
      const currentUserId = Number(
        JSON.parse(localStorage.getItem("userData") || "{}").id
      );
      const response = await axios.get(
        `http://localhost:8080/api/users/search?q=${encodeURIComponent(searchQuery)}`
      );
      // Dodatna UI zastita: ne prikazuj admina ni trenutno prijavljeni nalog.
      setSearchResults(
        Array.isArray(response.data)
          ? response.data.filter(
              (result: any) =>
                result.role?.name !== "ADMIN" &&
                Number(result.id) !== currentUserId
            )
          : []
      );
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  };

  const handleClickProfile = (userId: number) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div>
      <div className="nav-background"></div>
      <nav className="navigation">
        <ul className="search-ul">
          <li className="search-bar">
            <div className="search-container">
              <span className="icon">
                <IonIcon icon={searchOutline} />
              </span>
              <input
                className="inputSearch"
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {searchResults.length > 0 && (
              <div className="search-results">
                <ul>
                  {searchResults.map((result, index) => (
                    <li
                      key={index}
                      className="search-result-item"
                      onClick={() => handleClickProfile(result.id)}
                    >
                      <div className="profile-container">
                        {/* Display profile picture if available */}
                        {result.bio && (
                          <img
                            src={result.bio?.profilePictureUrl || DEFAULT_PROFILE_PICTURE_URL}
                            alt="Profile"
                            className="profile-picture"
                          />
                        )}
                      </div>
                      <div className="username-container">
                        <span className="username">{result.username}</span>
                        <div className="name-container">
                          {/* Display first name if available */}
                          {result.bio && result.bio.firstName && (
                            <span className="first-name">
                              {result.bio.firstName}
                            </span>
                          )}
                          {/* Display last name if available */}
                          {result.bio && result.bio.lastName && (
                            <span className="last-name">
                              {result.bio.lastName}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        </ul>
        <ul className="logo-section">
          <li>
            <img src={logoImg} alt="Fest" className="logo" />
          </li>
        </ul>
        <ul>
          <li
            className={`list ${activeIndex === 0 ? "active" : ""}`}
            onClick={(event) => handleItemClick(event, 0)}
          >
            <a href="#">
              <span className="icon">
                <IonIcon icon={homeOutline} />
              </span>
              <span className="text">Home</span>
            </a>
          </li>
          <li
            className={`list ${activeIndex === 1 ? "active" : ""}`}
            onClick={(event) => handleItemClick(event, 1)}
          >
            <a href="#">
              <span className="icon">
                <IonIcon icon={personOutline} />
              </span>
              <span className="text">Profile</span>
            </a>
          </li>
          <li
            className={`list ${activeIndex === 2 ? "active" : ""}`}
            onClick={(event) => handleItemClick(event, 2)}
          >
            <a href="#">
              <span className="icon">
                <IonIcon icon={chatboxOutline} />
                {unreadMessagesCount > 0 && (
                  <span className="notification-badge message-badge">
                    {unreadMessagesCount}
                  </span>
                )}
              </span>
              <span className="text">Messages</span>
            </a>
          </li>
          <li
            className={`list ${activeIndex === 3 ? "active" : ""}`}
            onClick={(event) => handleItemClick(event, 3)}
          >
            <a href="#">
              <span className="icon">
                <IonIcon icon={notificationsOutline} />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </span>
              <span className="text">Notifications</span>
            </a>
          </li>
          <li
            className={`list ${activeIndex === 4 ? "active" : ""}`}
            onClick={(event) => handleItemClick(event, 4)}
          >
            <a href="#">
              <span className="icon">
                <IonIcon icon={settingsOutline} />
              </span>
              <span className="text">Settings</span>
            </a>
          </li>
          <div className="indicator"></div>
        </ul>
      </nav>
    </div>
  );
};

export default Navbar;
