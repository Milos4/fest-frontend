export type EventRequestStatus = "PENDING" | "ACCEPTED" | "DECLINED" | null;

export interface UserEvent {
  id: number;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  city?: string;
  cityName?: string;
  eventCity?: string;
  locationCity?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  maxAttendees?: number;
  type: string;
  hostUserId?: number;
  hostId?: number;
  userId?: number;
  hostUsername?: string;
  requestStatus?: EventRequestStatus;
  canViewDetails?: boolean;
}

export interface EventApplicant {
  id: number;
  userId?: number;
  username: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
  bio?: {
    firstName?: string;
    lastName?: string;
    profilePictureUrl?: string;
  };
  location?: string;
}

export interface EventJoinRequest {
  id?: number;
  requestId?: number;
  userId?: number;
  applicantId?: number;
  requesterId?: number;
  user?: EventApplicant;
  applicant?: EventApplicant;
  requester?: EventApplicant;
  username?: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
  location?: string;
  message?: string;
  status?: string;
}

export interface EventAttendee {
  id?: number;
  userId?: number;
  attendeeId?: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
  user?: EventApplicant;
  attendee?: EventApplicant;
  profile?: EventApplicant;
  bio?: {
    firstName?: string;
    lastName?: string;
    profilePictureUrl?: string;
  };
}

export interface EventAttendeeProfile {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
}

export type HomeView =
  | "feed"
  | "events"
  | "create-event"
  | "my-events"
  | "my-profile";
