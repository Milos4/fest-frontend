import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NavBar from "../component/navBar/Navbar";
import SideBar from "../component/sideBar/SideBar";
import Post from "../component/post/PostList";
import CreatePost from "../component/post/CreatePost";
import Settings from "../component/settings/Settings";
import ChangePasswordForm from "../component/settings/ChangePasswordForm";
import SettingsInfoPanel from "../component/settings/SettingsInfoPanel";
import DeleteAccountPanel from "../component/settings/DeleteAccountPanel";
import MyProfile from "../component/profileDetails/MyProfile";
import MyProfileOverview from "../component/profileDetails/MyProfileOverview";
import NotificationsList from "../component/notifications/NotificationsList";
import EventsList from "../component/events/EventsList";
import CreateEvent from "../component/events/CreateEvent";
import MyEvents from "../component/events/MyEvents";
import { HomeView } from "../component/events/eventTypes";
import MessagesPage from "../component/messages/MessagesPage";
import FloatingChat from "../component/messages/FloatingChat";
import { ChatUser } from "../component/messages/chatTypes";

type SettingsView =
  | "menu"
  | "change-password"
  | "privacy"
  | "help"
  | "delete-account";

const normalizeChatUser = (item: any): ChatUser | null => {
  const user =
    item?.following ||
    item?.followingUser ||
    item?.followedUser ||
    item?.contact ||
    item?.user ||
    item?.friend ||
    item;
  const bio = user?.bio || item?.bio || {};
  const id = Number(
    user?.id ??
      user?.userId ??
      item?.followingId ??
      item?.followedUserId ??
      item?.contactId ??
      item?.userId ??
      item?.id
  );

  if (!id) {
    return null;
  }

  return {
    id,
    username: user?.username || item?.username || `User ${id}`,
    firstName: bio.firstName || user?.firstName || item?.firstName || "",
    lastName: bio.lastName || user?.lastName || item?.lastName || "",
    profilePictureUrl:
      bio.profilePictureUrl ||
      user?.profilePictureUrl ||
      user?.profileImageUrl ||
      item?.profilePictureUrl ||
      item?.profileImageUrl ||
      "",
    isMutual: Boolean(
      user?.isMutual ?? item?.isMutual ?? user?.mutual ?? item?.mutual
    ),
  };
};

const extractChatUsers = (data: any): ChatUser[] => {
  const list = Array.isArray(data)
    ? data
    : data?.contacts ||
      data?.chatContacts ||
      data?.following ||
      data?.followings ||
      data?.users ||
      data?.content ||
      data?.data ||
      data?.items ||
      data?.results ||
      [];

  return Array.isArray(list)
    ? list
        .map(normalizeChatUser)
        .filter((user): user is ChatUser => Boolean(user))
        .sort((firstUser, secondUser) => {
          if (firstUser.isMutual !== secondUser.isMutual) {
            return firstUser.isMutual ? -1 : 1;
          }

          return firstUser.username.localeCompare(secondUser.username);
        })
    : [];
};

const HomePage: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [homeView, setHomeView] = useState<HomeView>("feed");
  const [hasVisitedNotifications, setHasVisitedNotifications] = useState(false);
  const [settingsView, setSettingsView] = useState<SettingsView>("menu");
  const [currentChatUser, setCurrentChatUser] = useState<ChatUser | null>(null);
  const [followingUsers, setFollowingUsers] = useState<ChatUser[]>([]);

  const navigate = useNavigate();
  const location = useLocation();

  const userData = useMemo(
    () => JSON.parse(localStorage.getItem("userData") || "{}"),
    []
  );
  const userId = userData.id;

  useEffect(() => {
    if (!userData || Object.keys(userData).length === 0) {
      navigate("/");
    }
  }, [navigate, userData]);

  useEffect(() => {
    const state = location.state as {
      homeView?: HomeView;
      activeIndex?: number;
    } | null;

    if (state?.homeView) {
      setActiveIndex(0);
      setHomeView(state.homeView);
      navigate(location.pathname, { replace: true, state: null });
      return;
    }

    if (typeof state?.activeIndex === "number") {
      setActiveIndex(state.activeIndex);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (activeIndex === 3 && !hasVisitedNotifications) {
      setHasVisitedNotifications(true);
    }

    if (hasVisitedNotifications && activeIndex === 3) {
      fetch(`http://localhost:8080/api/notifications/mark-all-read/${userId}`, {
        method: "POST",
      }).catch((error) =>
        console.error("Error marking notifications as read:", error)
      );
    }
  }, [activeIndex, hasVisitedNotifications, userId]);

  useEffect(() => {
    if (activeIndex !== 4 && settingsView !== "menu") {
      setSettingsView("menu");
    }
  }, [activeIndex, settingsView]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const fallbackUser: ChatUser = {
      id: Number(userId),
      username: userData.username || `User ${userId}`,
      firstName: userData.bio?.firstName || "",
      lastName: userData.bio?.lastName || "",
      profilePictureUrl: userData.bio?.profilePictureUrl || "",
    };

    setCurrentChatUser(fallbackUser);

    const fetchChatData = async () => {
      try {
        const [profileResponse, contactsResponse] = await Promise.all([
          fetch(`http://localhost:8080/api/users/${userId}`),
          fetch(`http://localhost:8080/api/follow/chat-contacts?userId=${userId}`),
        ]);

        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          setCurrentChatUser(normalizeChatUser(profile) || fallbackUser);
        }

        let normalizedFollowing: ChatUser[] = [];

        if (contactsResponse.ok) {
          const contactsData = await contactsResponse.json();
          normalizedFollowing = extractChatUsers(contactsData);
        }

        if (normalizedFollowing.length === 0) {
          const fallbackFollowingResponse = await fetch(
            `http://localhost:8080/api/follow/following?userId=${userId}`
          );

          if (fallbackFollowingResponse.ok) {
            const fallbackFollowingData = await fallbackFollowingResponse.json();
            normalizedFollowing = extractChatUsers(fallbackFollowingData);
          }
        }

        setFollowingUsers(normalizedFollowing);
      } catch (error) {
        console.error("Error loading chat data:", error);
      }
    };

    fetchChatData();
  }, [userData, userId]);

  useEffect(() => {
    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{
        userId?: number;
        profilePictureUrl?: string;
        userData?: any;
      }>;

      if (
        customEvent.detail?.userId &&
        String(customEvent.detail.userId) !== String(userId)
      ) {
        return;
      }

      setCurrentChatUser((previous) => ({
        id: Number(userId),
        username:
          customEvent.detail?.userData?.username ||
          previous?.username ||
          userData.username ||
          `User ${userId}`,
        firstName:
          customEvent.detail?.userData?.bio?.firstName ||
          previous?.firstName ||
          "",
        lastName:
          customEvent.detail?.userData?.bio?.lastName ||
          previous?.lastName ||
          "",
        profilePictureUrl:
          customEvent.detail?.profilePictureUrl ||
          customEvent.detail?.userData?.bio?.profilePictureUrl ||
          previous?.profilePictureUrl ||
          "",
      }));
    };

    window.addEventListener("profile-updated", handleProfileUpdated);

    return () => {
      window.removeEventListener("profile-updated", handleProfileUpdated);
    };
  }, [userData.username, userId]);

  const handleSetActiveIndex = (index: number) => {
    setActiveIndex(index);

    if (index !== 0) {
      setHomeView("feed");
    }
  };

  const handleSelectHomeView = (view: HomeView) => {
    setActiveIndex(0);
    setHomeView(view);
  };

  const renderSettingsDetail = () => {
    switch (settingsView) {
      case "change-password":
        return (
          <ChangePasswordForm
            isVisible={true}
            onBack={() => setSettingsView("menu")}
          />
        );
      case "privacy":
        return (
          <SettingsInfoPanel
            title="Privacy"
            isVisible={true}
            onBack={() => setSettingsView("menu")}
            paragraphs={[
              "Your account data is used only for login, profile display, posts, comments, reactions, and other core features of the Fest platform.",
              "Passwords should stay encrypted on the backend, and profile information should only be visible according to the rules you define in the application.",
              "This section is a placeholder for now and can later include privacy preferences, profile visibility controls, and data export options.",
            ]}
          />
        );
      case "help":
        return (
          <SettingsInfoPanel
            title="Help"
            isVisible={true}
            onBack={() => setSettingsView("menu")}
            paragraphs={[
              "Use the navigation bar to move between home, profile, notifications, and settings inside the application.",
              "In the feed you can create posts, react to other posts, write comments, and search for other users.",
              "If something is not working, the next step can be adding a support form, FAQ section, or contact link connected to the backend.",
            ]}
          />
        );
      case "delete-account":
        return (
          <DeleteAccountPanel
            isVisible={true}
            onBack={() => setSettingsView("menu")}
          />
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (activeIndex) {
      case 0:
        if (homeView === "events") {
          return (
            <EventsList
              currentUserId={userId}
              onOpenMyEvents={() => setHomeView("my-events")}
            />
          );
        }

        if (homeView === "create-event") {
          return (
            <CreateEvent
              currentUserId={userId}
              onCreated={() => setHomeView("my-events")}
            />
          );
        }

        if (homeView === "my-events") {
          return <MyEvents currentUserId={userId} />;
        }

        if (homeView === "my-profile") {
          return <MyProfile />;
        }

        return (
          <div>
            <CreatePost />
            <Post />
          </div>
        );
      case 1:
        return <MyProfileOverview />;
      case 2:
        return currentChatUser ? (
          <MessagesPage
            currentUser={currentChatUser}
            followingUsers={followingUsers}
          />
        ) : null;
      case 3:
        return <NotificationsList userId={userId} />;
      case 4:
        return (
          <div
            className={`settings-workspace ${
              settingsView !== "menu" ? "detail-mode" : ""
            }`}
          >
            {settingsView === "menu" ? (
              <Settings onSelectView={setSettingsView} />
            ) : (
              <div className="settings-detail-panel visible">
                {renderSettingsDetail()}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="login-page">
      <NavBar activeIndex={activeIndex} setActiveIndex={handleSetActiveIndex} />
      <SideBar
        onSelectHomeView={handleSelectHomeView}
        activeHomeView={activeIndex === 0 ? homeView : undefined}
        withTopNav
      />
      {renderContent()}
      {currentChatUser && (
        <FloatingChat
          currentUser={currentChatUser}
          followingUsers={followingUsers}
        />
      )}
    </div>
  );
};

export default HomePage;
