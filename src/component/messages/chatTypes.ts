import { Timestamp } from "firebase/firestore";

export interface ChatUser {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
  isMutual?: boolean;
}

export interface ChatSummary {
  id: string;
  participants: number[];
  participantUsernames?: Record<string, string>;
  participantProfilePictures?: Record<string, string>;
  lastMessage?: string;
  lastMessageAt?: Timestamp;
  lastSenderId?: number;
  requestStatusByUser?: Record<string, "accepted">;
  blockedBy?: Record<string, boolean>;
  unreadBy?: Record<string, boolean>;
}

export interface ChatMessage {
  id: string;
  senderId: number;
  text: string;
  createdAt?: Timestamp;
}
