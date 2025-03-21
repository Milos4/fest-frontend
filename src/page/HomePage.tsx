import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../component/navBar/Navbar";
import SideBar from "../component/sideBar/SideBar";
import Post from "../component/post/PostList";
import CreatePost from "../component/post/CreatePost";
import Settings from "../component/settings/Settings";
import MyProfile from "../component/profileDetails/MyProfile";
import NotificationsList from "../component/notifications/NotificationsList";

const HomePage: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasVisitedNotifications, setHasVisitedNotifications] = useState(false);

  const navigate = useNavigate();

  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const userId = userData.id;

  useEffect(() => {
    if (!userData || Object.keys(userData).length === 0) {
      navigate("/"); // Vrati korisnika na login
    }
  }, [navigate]);

  useEffect(() => {
    // Ako je korisnik prvi put na notifikacijama, sačekaj da ih vidi
    if (activeIndex === 3 && !hasVisitedNotifications) {
      setHasVisitedNotifications(true); // Postavi da ih je video
    }

    // Ako se korisnik VRATI na notifikacije nakon što ih je video => označi kao pročitane
    if (hasVisitedNotifications && activeIndex === 3) {
      fetch(`http://localhost:8080/api/notifications/mark-all-read/${userId}`, {
        method: "POST",
      }).catch((error) =>
        console.error("Error marking notifications as read:", error)
      );
    }
  }, [activeIndex, hasVisitedNotifications, userId]);

  const renderContent = () => {
    switch (activeIndex) {
      case 0:
        return (
          <div>
            <CreatePost />
            <Post />
          </div>
        );
      case 1:
        return <MyProfile />;
      case 2:
        return <NotificationsList userId={userId} />;
      case 3:
        return <NotificationsList userId={userId} />;
      case 4:
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <div className="login-page">
      <NavBar activeIndex={activeIndex} setActiveIndex={setActiveIndex} />
      <SideBar />
      {renderContent()}
    </div>
  );
};

export default HomePage;
