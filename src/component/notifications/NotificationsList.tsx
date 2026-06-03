import { useState, useEffect } from "react";
import "./notifications.css";

interface Notification {
  id: number;
  content: string;
  type: string;
  createdAt: string;
  read: boolean;
}

interface FollowRequestUser {
  id: number;
  username: string;
}

interface FollowRequest {
  id: number;
  follower: FollowRequestUser;
  following: FollowRequestUser;
  status: "PENDING";
  actionDate: string;
}

const NotificationsList = ({ userId }: { userId: number }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FollowRequest[]>([]);
  const [hasSeen, setHasSeen] = useState(false);
  const [requestActionId, setRequestActionId] = useState<number | null>(null);

  const formatNotificationDate = (dateValue?: string) => {
    if (!dateValue) return "";

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/follow/pending?userId=${userId}`
      );
      if (!response.ok) throw new Error("Failed to fetch pending requests");
      const data = await response.json();
      setPendingRequests(data);
    } catch (error) {
      console.error("Error fetching pending follow requests:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchPendingRequests();

    return () => {
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

  const handleRequestAction = async (
    followerId: number,
    action: "accept" | "reject"
  ) => {
    setRequestActionId(followerId);

    try {
      const response = await fetch(
        `http://localhost:8080/api/follow/${action}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            followerId,
            followingId: userId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to ${action} request`);
      }

      setPendingRequests((prev) =>
        prev.filter((request) => request.follower.id !== followerId)
      );
      window.dispatchEvent(
        new CustomEvent("profile-stats-refresh", {
          detail: { userId },
        })
      );
      window.dispatchEvent(
        new CustomEvent("profile-stats-refresh", {
          detail: { userId: followerId },
        })
      );
      fetchNotifications();
    } catch (error) {
      console.error(`Error trying to ${action} request:`, error);
    } finally {
      setRequestActionId(null);
    }
  };

  return (
    <div className="notifications-container">
      <div className="notifications-card">
        <h2 className="notifications-header">Notifikacije</h2>

        {pendingRequests.length > 0 && (
          <div className="notifications-section">
            <h3 className="notifications-subheader">Follow Requests</h3>
            <ul className="notifications-list">
              {pendingRequests.map((request) => (
                <li key={request.id} className="unread notification-item">
                  <div className="notification-content">
                    <span>
                      {request.follower.username} requested to follow you
                    </span>
                    <span className="notification-date">
                      {formatNotificationDate(request.actionDate)}
                    </span>
                  </div>
                  <div className="notification-actions">
                    <button
                      className="notification-action accept"
                      onClick={() =>
                        handleRequestAction(request.follower.id, "accept")
                      }
                      disabled={requestActionId === request.follower.id}
                    >
                      Accept
                    </button>
                    <button
                      className="notification-action reject"
                      onClick={() =>
                        handleRequestAction(request.follower.id, "reject")
                      }
                      disabled={requestActionId === request.follower.id}
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="notifications-section">
          <h3 className="notifications-subheader">Activity</h3>
          <ul className="notifications-list">
            {notifications
              .filter((notif) => notif.type !== "FOLLOW_REQUEST")
              .map((notif) => (
              <li
                key={notif.id}
                className={`${notif.read ? "read" : "unread"} notification-item`}
              >
                <div className="notification-content">
                  <span>{notif.content}</span>
                  <span className="notification-date">
                    {formatNotificationDate(notif.createdAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotificationsList;
