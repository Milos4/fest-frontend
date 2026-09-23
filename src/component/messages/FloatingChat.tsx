import React, { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, Timestamp } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCommentDots,
  faMagnifyingGlass,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { DEFAULT_PROFILE_PICTURE_URL } from "../../utils/profilePicture";
import ChatWindow from "./ChatWindow";
import { ChatUser } from "./chatTypes";
import PresenceStatus from "./PresenceStatus";
import { db } from "../../firebase";
import "./messages.css";

interface FloatingChatProps {
  currentUser: ChatUser;
  followingUsers: ChatUser[];
}

interface PresenceSnapshot {
  online?: boolean;
  lastActiveAt?: Timestamp;
  lastActiveAtMs?: number;
}

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

const isPresenceOnline = (presence?: PresenceSnapshot) => {
  const lastActiveMs =
    presence?.lastActiveAt?.toMillis?.() || presence?.lastActiveAtMs || 0;

  return Boolean(
    presence?.online && lastActiveMs && Date.now() - lastActiveMs < ONLINE_THRESHOLD_MS
  );
};

const FloatingChat: React.FC<FloatingChatProps> = ({
  currentUser,
  followingUsers,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState<ChatUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [presenceByUserId, setPresenceByUserId] = useState<
    Record<number, PresenceSnapshot>
  >({});

  useEffect(() => {
    if (!isOpen || followingUsers.length === 0) {
      return;
    }

    const unsubscribers = followingUsers.map((user) =>
      onSnapshot(doc(db, "presence", String(user.id)), (snapshot) => {
        setPresenceByUserId((previous) => ({
          ...previous,
          [user.id]: snapshot.exists()
            ? (snapshot.data() as PresenceSnapshot)
            : {},
        }));
      })
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [followingUsers, isOpen]);

  const filteredUsers = useMemo(() => {
    const cleanQuery = searchQuery.trim().toLowerCase();
    const matchingUsers = cleanQuery
      ? followingUsers.filter((user) => {
          const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
          return `${user.username} ${fullName}`.toLowerCase().includes(cleanQuery);
        })
      : followingUsers;

    return [...matchingUsers].sort((firstUser, secondUser) => {
      const firstOnline = isPresenceOnline(presenceByUserId[firstUser.id]);
      const secondOnline = isPresenceOnline(presenceByUserId[secondUser.id]);

      if (firstOnline !== secondOnline) {
        return firstOnline ? -1 : 1;
      }

      if (firstUser.isMutual !== secondUser.isMutual) {
        return firstUser.isMutual ? -1 : 1;
      }

      return firstUser.username.localeCompare(secondUser.username);
    });
  }, [followingUsers, presenceByUserId, searchQuery]);

  return (
    <>
      {isOpen && !activeChatUser && (
        <div className="floating-chat-panel">
          <div className="floating-chat-header">
            <strong>New chat</strong>
            <button className="chat-icon-button" onClick={() => setIsOpen(false)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <label className="floating-chat-search">
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search people you follow..."
            />
          </label>
          <div className="floating-chat-users">
            {followingUsers.length === 0 ? (
              <div className="messages-empty small">You are not following anyone.</div>
            ) : filteredUsers.length === 0 ? (
              <div className="messages-empty small">No contacts found.</div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  className="floating-chat-user"
                  onClick={() => setActiveChatUser(user)}
                >
                  <img src={user.profilePictureUrl || DEFAULT_PROFILE_PICTURE_URL} alt={user.username} />
                  <span>
                    <strong>{user.username}</strong>
                    {(user.firstName || user.lastName) && (
                      <small>
                        {user.firstName} {user.lastName}
                      </small>
                    )}
                  </span>
                  <span className="floating-chat-meta">
                    <PresenceStatus userId={user.id} compact />
                    {user.isMutual && <em>Mutual</em>}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {activeChatUser && (
        <ChatWindow
          currentUser={currentUser}
          otherUser={activeChatUser}
          onClose={() => setActiveChatUser(null)}
        />
      )}

      {!activeChatUser && (
        <button className="floating-chat-button" onClick={() => setIsOpen((prev) => !prev)}>
          <FontAwesomeIcon icon={isOpen ? faTimes : faCommentDots} />
        </button>
      )}
    </>
  );
};

export default FloatingChat;
