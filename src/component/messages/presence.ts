import { useEffect, useMemo, useState } from "react";
import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";

export interface PresenceState {
  online?: boolean;
  lastActiveAt?: Timestamp;
  lastActiveAtMs?: number;
}

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;
const HEARTBEAT_MS = 30 * 1000;

const writePresence = (userId: number, online: boolean) =>
  setDoc(
    doc(db, "presence", String(userId)),
    {
      userId,
      online,
      lastActiveAt: serverTimestamp(),
      lastActiveAtMs: Date.now(),
    },
    { merge: true }
  )
    .then(() => {
      if (process.env.NODE_ENV === "development") {
        console.info(`Presence saved for user ${userId}:`, online);
      }
    })
    .catch((error) => {
      console.error(
        "Error writing presence. Check Firestore rules for /presence/{userId}:",
        error
      );
    });

export const markUserOnline = (userId?: number | null) => {
  if (!userId) {
    return;
  }

  writePresence(userId, true);
};

export const useCurrentUserPresence = (userId?: number | null) => {
  useEffect(() => {
    if (!userId) {
      return;
    }

    writePresence(userId, true);

    const heartbeat = window.setInterval(() => {
      writePresence(userId, document.visibilityState === "visible");
    }, HEARTBEAT_MS);

    const handleVisibilityChange = () => {
      writePresence(userId, document.visibilityState === "visible");
    };

    const handlePageHide = () => {
      writePresence(userId, false);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [userId]);
};

export const usePresence = (userId?: number | null) => {
  const [presence, setPresence] = useState<PresenceState>({});

  useEffect(() => {
    if (!userId) {
      setPresence({});
      return;
    }

    const unsubscribe = onSnapshot(doc(db, "presence", String(userId)), (snapshot) => {
      setPresence(snapshot.exists() ? (snapshot.data() as PresenceState) : {});
    });

    return unsubscribe;
  }, [userId]);

  return useMemo(() => {
    const lastActiveMs =
      presence.lastActiveAt?.toMillis?.() || presence.lastActiveAtMs || 0;
    const isRecentlyActive =
      lastActiveMs > 0 && Date.now() - lastActiveMs < ONLINE_THRESHOLD_MS;
    const isOnline = Boolean(presence.online && isRecentlyActive);

    return {
      ...presence,
      isOnline,
      lastSeenText: formatLastSeen(lastActiveMs, isOnline),
    };
  }, [presence]);
};

const formatLastSeen = (lastActiveMs: number, isOnline: boolean) => {
  if (isOnline) {
    return "Online";
  }

  if (!lastActiveMs) {
    return "Offline";
  }

  const diffMs = Date.now() - lastActiveMs;
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `Last seen ${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `Last seen ${diffHours} h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `Last seen ${diffDays} d ago`;
};
