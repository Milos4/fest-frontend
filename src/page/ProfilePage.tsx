// ProfilePage.tsx

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import SideBar from "../component/sideBar/SideBar";
import Profile from "../component/profileDetails/ProfileDetails";
import axios from "axios";
import UserPosts from "../component/post/UserPosts";

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8080/api/users/${userId}`
        );
        setUserData(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [userId]);

  return (
    <div className="profile-page">
      <SideBar />
      <div className="main-content">
        {userData && <Profile userData={userData} />}
      </div>
      <UserPosts />
    </div>
  );
};

export default ProfilePage;
