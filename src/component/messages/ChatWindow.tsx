import React, { useEffect, useRef, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faTimes } from "@fortawesome/free-solid-svg-icons";
import { db } from "../../firebase";
import logoImg from "../../images/logo.png";
import { ChatMessage, ChatUser } from "./chatTypes";
import PresenceStatus from "./PresenceStatus";
import "./messages.css";

interface ChatWindowProps {
  currentUser: ChatUser;
  otherUser: ChatUser;
  onClose: () => void;
}

const getChatId = (firstUserId: number, secondUserId: number) =>
  [firstUserId, secondUserId].sort((a, b) => a - b).join("_");

const formatMessageTime = (message: ChatMessage) =>
  message.createdAt
    ? message.createdAt.toDate().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const ChatWindow: React.FC<ChatWindowProps> = ({
  currentUser,
  otherUser,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const chatId = getChatId(currentUser.id, otherUser.id);

  useEffect(() => {
    updateDoc(doc(db, "chats", chatId), {
      [`unreadBy.${currentUser.id}`]: false,
    }).catch(() => undefined);
  }, [chatId, currentUser.id]);

  useEffect(() => {
    const messagesQuery = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      setMessages(
        snapshot.docs.map((messageDoc) => ({
          id: messageDoc.id,
          ...(messageDoc.data() as Omit<ChatMessage, "id">),
        }))
      );
    });

    return unsubscribe;
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();

    const cleanText = text.trim();
    if (!cleanText || isSending) return;

    setIsSending(true);

    try {
      const chatRef = doc(db, "chats", chatId);
      const chatPayload = {
        participants: [currentUser.id, otherUser.id],
        participantMap: {
          [String(currentUser.id)]: true,
          [String(otherUser.id)]: true,
        },
        participantUsernames: {
          [String(currentUser.id)]: currentUser.username,
          [String(otherUser.id)]: otherUser.username,
        },
        participantProfilePictures: {
          [String(currentUser.id)]: currentUser.profilePictureUrl || "",
          [String(otherUser.id)]: otherUser.profilePictureUrl || "",
        },
        requestStatusByUser: {
          [String(currentUser.id)]: "accepted",
        },
        unreadBy: {
          [String(currentUser.id)]: false,
          [String(otherUser.id)]: true,
        },
        lastMessage: cleanText,
        lastMessageAt: serverTimestamp(),
        lastSenderId: currentUser.id,
      };

      await setDoc(chatRef, chatPayload, { merge: true });
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: currentUser.id,
        text: cleanText,
        createdAt: serverTimestamp(),
      });

      setText("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="chat-window">
      <div className="chat-window-header">
        <div className="chat-window-user">
          <img src={otherUser.profilePictureUrl || logoImg} alt={otherUser.username} />
          <div>
            <strong>{otherUser.username}</strong>
            <PresenceStatus userId={otherUser.id} />
          </div>
        </div>
        <button className="chat-icon-button" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">No messages yet.</div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`chat-message-wrap ${
                message.senderId === currentUser.id ? "mine" : "theirs"
              }`}
            >
              <div className="chat-message">
                {message.text}
              </div>
              <span className="chat-message-meta">
                {message.senderId === currentUser.id ? "You" : otherUser.username}
                {formatMessageTime(message) && ` - ${formatMessageTime(message)}`}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-row" onSubmit={sendMessage}>
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Write a message..."
        />
        <button disabled={isSending || !text.trim()}>
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </form>
    </section>
  );
};

export default ChatWindow;
