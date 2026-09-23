import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faCheck,
  faMessage,
} from "@fortawesome/free-solid-svg-icons";
import { db } from "../../firebase";
import { DEFAULT_PROFILE_PICTURE_URL } from "../../utils/profilePicture";
import ChatWindow from "./ChatWindow";
import { ChatSummary, ChatUser } from "./chatTypes";
import PresenceStatus from "./PresenceStatus";
import "./messages.css";

interface MessagesPageProps {
  currentUser: ChatUser;
  followingUsers: ChatUser[];
}

const MessagesPage: React.FC<MessagesPageProps> = ({
  currentUser,
  followingUsers,
}) => {
  const [activeTab, setActiveTab] = useState<"chats" | "requests">("chats");
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeChatUser, setActiveChatUser] = useState<ChatUser | null>(null);

  const followingIds = useMemo(
    () => new Set(followingUsers.map((user) => Number(user.id))),
    [followingUsers]
  );

  useEffect(() => {
    if (!currentUser.id) return;

    const chatsQuery = query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUser.id)
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const nextChats = snapshot.docs
        .map((chatDoc) => ({
          id: chatDoc.id,
          ...(chatDoc.data() as Omit<ChatSummary, "id">),
        }))
        .sort((a, b) => {
          const first = b.lastMessageAt?.toMillis?.() || 0;
          const second = a.lastMessageAt?.toMillis?.() || 0;
          return first - second;
        });

      setChats(nextChats);
    });

    return unsubscribe;
  }, [currentUser.id]);

  const getOtherUserFromChat = (chat: ChatSummary): ChatUser => {
    const otherUserId =
      chat.participants.find((participantId) => participantId !== currentUser.id) ||
      0;

    return {
      id: otherUserId,
      username:
        chat.participantUsernames?.[String(otherUserId)] || `User ${otherUserId}`,
      profilePictureUrl:
        chat.participantProfilePictures?.[String(otherUserId)] || "",
    };
  };

  const formatChatTime = (chat: ChatSummary) => {
    if (!chat.lastMessageAt) {
      return "";
    }

    const messageDate = chat.lastMessageAt.toDate();
    const isToday = messageDate.toDateString() === new Date().toDateString();

    return messageDate.toLocaleString([], {
      hour: "2-digit",
      minute: "2-digit",
      ...(isToday ? {} : { day: "2-digit", month: "short" }),
    });
  };

  const getLastSenderLabel = (chat: ChatSummary, otherUser: ChatUser) =>
    chat.lastSenderId === currentUser.id ? "You" : otherUser.username;

  const isUnreadChat = (chat: ChatSummary) =>
    Boolean(chat.unreadBy?.[String(currentUser.id)]);

  const getChatKind = (chat: ChatSummary) => {
    const otherUser = getOtherUserFromChat(chat);
    const currentUserKey = String(currentUser.id);
    const isFollowing = followingIds.has(Number(otherUser.id));
    const isAccepted =
      chat.requestStatusByUser?.[currentUserKey] === "accepted";
    const isBlocked = Boolean(chat.blockedBy?.[currentUserKey]);
    const isIncomingRequest =
      !isFollowing && chat.lastSenderId !== currentUser.id && !isAccepted;

    if (isBlocked) {
      return "blocked";
    }

    if (isIncomingRequest) {
      return "request";
    }

    return isFollowing || isAccepted || chat.lastSenderId === currentUser.id
      ? "chat"
      : "request";
  };

  const acceptRequest = async (chat: ChatSummary) => {
    await updateDoc(doc(db, "chats", chat.id), {
      [`requestStatusByUser.${currentUser.id}`]: "accepted",
      [`unreadBy.${currentUser.id}`]: false,
    });
  };

  const blockRequest = async (chat: ChatSummary) => {
    await updateDoc(doc(db, "chats", chat.id), {
      [`blockedBy.${currentUser.id}`]: true,
      [`unreadBy.${currentUser.id}`]: false,
    });
  };

  const visibleChats = chats.filter((chat) => {
    const kind = getChatKind(chat);

    if (kind === "blocked") {
      return false;
    }

    return activeTab === "chats" ? kind === "chat" : kind === "request";
  });

  const chatUnreadCount = chats.filter(
    (chat) => getChatKind(chat) === "chat" && isUnreadChat(chat)
  ).length;

  const requestUnreadCount = chats.filter(
    (chat) => getChatKind(chat) === "request" && isUnreadChat(chat)
  ).length;

  return (
    <div className="messages-page">
      <div className="messages-shell">
        <div className="messages-header">
          <div>
            <h2>Messages</h2>
            <p>Read your latest chats and message requests.</p>
          </div>
          <FontAwesomeIcon icon={faMessage} />
        </div>

        <div className="messages-tabs">
          <button
            className={activeTab === "chats" ? "active" : ""}
            onClick={() => setActiveTab("chats")}
          >
            Chats
            {chatUnreadCount > 0 && <span>{chatUnreadCount}</span>}
          </button>
          <button
            className={activeTab === "requests" ? "active" : ""}
            onClick={() => setActiveTab("requests")}
          >
            Requests
            {requestUnreadCount > 0 && <span>{requestUnreadCount}</span>}
          </button>
        </div>

        <div className="messages-list">
          {visibleChats.length === 0 ? (
            <div className="messages-empty">
              {activeTab === "chats"
                ? "No chats with people you follow yet."
                : "No message requests."}
            </div>
          ) : (
            visibleChats.map((chat) => {
              const otherUser = getOtherUserFromChat(chat);

              const senderLabel = getLastSenderLabel(chat, otherUser);

              return (
                <div
                  key={chat.id}
                  className={`message-row ${isUnreadChat(chat) ? "unread" : ""}`}
                >
                  <img
                    src={otherUser.profilePictureUrl || DEFAULT_PROFILE_PICTURE_URL}
                    alt={otherUser.username}
                  />
                  <button
                    className="message-row-main"
                    onClick={() =>
                      activeTab === "chats" && setActiveChatUser(otherUser)
                    }
                  >
                    <strong>{otherUser.username}</strong>
                    <PresenceStatus userId={otherUser.id} />
                    <span>
                      {chat.lastMessage
                        ? `${senderLabel}: ${chat.lastMessage}`
                        : "No messages yet."}
                    </span>
                  </button>
                  <div className="message-row-side">
                    <small>{formatChatTime(chat)}</small>
                    {activeTab === "requests" && (
                      <div className="message-request-actions">
                        <button
                          className="accept"
                          onClick={() => acceptRequest(chat)}
                          title="Accept"
                        >
                          <FontAwesomeIcon icon={faCheck} />
                        </button>
                        <button
                          className="block"
                          onClick={() => blockRequest(chat)}
                          title="Block"
                        >
                          <FontAwesomeIcon icon={faBan} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {activeChatUser && (
        <ChatWindow
          currentUser={currentUser}
          otherUser={activeChatUser}
          onClose={() => setActiveChatUser(null)}
        />
      )}
    </div>
  );
};

export default MessagesPage;
