import React from "react";
import { usePresence } from "./presence";
import "./messages.css";

interface PresenceStatusProps {
  userId: number;
  compact?: boolean;
}

const PresenceStatus: React.FC<PresenceStatusProps> = ({ userId, compact = false }) => {
  const presence = usePresence(userId);

  return (
    <span className={`presence-status ${compact ? "compact" : ""}`}>
      <span
        className={`presence-dot ${
          presence.isOnline ? "online" : "offline"
        }`}
      />
      {!compact && <span>{presence.lastSeenText}</span>}
    </span>
  );
};

export default PresenceStatus;
