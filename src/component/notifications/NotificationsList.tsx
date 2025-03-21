import { useState, useEffect } from "react";
import "./notifications.css";

interface Notification {
  id: number;
  content: string;
  type: string;
  createdAt: string;
  read: boolean;
}
const NotificationsList = ({ userId }: { userId: number }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasSeen, setHasSeen] = useState(false); // Prati da li je korisnik video notifikacije

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/notifications/${userId}?limit=10&sort=desc`
        );
        if (!response.ok) throw new Error("Failed to fetch notifications");
        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();

    return () => {
      // Kada korisnik napusti komponentu, obeleži kao pročitano
      if (!hasSeen) {
        markNotificationsAsRead();
        setHasSeen(true);
      }
    };
  }, [userId]);

  const markNotificationsAsRead = async () => {
    try {
      await fetch(
        `http://localhost:8080/api/notifications/mark-all-read/${userId}`,
        {
          method: "POST",
        }
      );
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };
  return (
    <div className="notifications-container">
      <div className="notifications-card">
        <h2 className="notifications-header">Notifikacije</h2>
        <ul className="notifications-list">
          {notifications.map((notif) => (
            <li key={notif.id} className={notif.read ? "read" : "unread"}>
              {notif.content}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default NotificationsList;
