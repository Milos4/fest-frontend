import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot, faTimes, faUsers } from "@fortawesome/free-solid-svg-icons";
import { DEFAULT_PROFILE_PICTURE_URL } from "../../utils/profilePicture";
import { EventAttendee, EventAttendeeProfile, UserEvent } from "./eventTypes";
import EventApplicantProfileModal from "./EventApplicantProfileModal";

interface EventDetailsModalProps {
  eventId: number;
  currentUserId: number;
  onClose: () => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  eventId,
  currentUserId,
  onClose,
}) => {
  const [event, setEvent] = useState<UserEvent | null>(null);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [profilePreview, setProfilePreview] = useState<{
    userId: number;
    username?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);

      try {
        const response = await fetch(
          `http://localhost:8080/api/user-events/${eventId}?currentUserId=${currentUserId}`
        );
        if (!response.ok) throw new Error("Failed to fetch event details");

        const details = await response.json();
        setEvent(details);

        if (details.canViewDetails) {
          const attendeesResponse = await fetch(
            `http://localhost:8080/api/user-events/${eventId}/attendees?currentUserId=${currentUserId}`
          );

          if (attendeesResponse.ok) {
            setAttendees(await attendeesResponse.json());
          }
        } else {
          setAttendees([]);
        }
      } catch (error) {
        console.error("Error fetching event details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [currentUserId, eventId]);

  const formatDateTime = (value?: string) =>
    value
      ? new Date(value).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Not specified";

  const mapUrl =
    event?.latitude && event?.longitude
      ? `https://www.google.com/maps?q=${event.latitude},${event.longitude}`
      : event?.location
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          event.location
        )}`
      : "";
  const canViewPrivateDetails = Boolean(event?.canViewDetails);
  const getHostId = (eventData: UserEvent) =>
    eventData.hostUserId || eventData.hostId || eventData.userId || 0;
  const getAttendeeProfile = (attendee: EventAttendee): EventAttendeeProfile => {
    const nestedUser = attendee.user || attendee.attendee || attendee.profile;
    const bio = nestedUser?.bio || attendee.bio || {};

    return {
      id:
        nestedUser?.id ||
        nestedUser?.userId ||
        attendee.userId ||
        attendee.attendeeId ||
        attendee.id ||
        0,
      username: nestedUser?.username || attendee.username || "Unknown",
      firstName: nestedUser?.firstName || attendee.firstName || bio.firstName,
      lastName: nestedUser?.lastName || attendee.lastName || bio.lastName,
      profilePictureUrl:
        nestedUser?.profilePictureUrl ||
        attendee.profilePictureUrl ||
        bio.profilePictureUrl,
    };
  };

  return (
    <div className="event-modal-overlay" onClick={onClose}>
      <div className="event-modal" onClick={(e) => e.stopPropagation()}>
        <div className="event-modal-header">
          <div>
            <h3>{event?.name || "Event details"}</h3>
            <p>{event?.type || "Loading event"}</p>
          </div>
          <button className="event-icon-button" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {isLoading ? (
          <div className="events-empty">Loading event...</div>
        ) : event ? (
          <div className="event-modal-body">
            <p className="event-description">{event.description}</p>
            <div className="event-detail-grid">
              <div>
                <span>Starts</span>
                <strong>{formatDateTime(event.startTime)}</strong>
              </div>
              <div>
                <span>Ends</span>
                <strong>{formatDateTime(event.endTime)}</strong>
              </div>
              <div>
                <span>Host</span>
                {getHostId(event) ? (
                  <button
                    className="event-profile-link"
                    onClick={() =>
                      setProfilePreview({
                        userId: getHostId(event),
                        username: event.hostUsername,
                      })
                    }
                  >
                    {event.hostUsername || "Unknown"}
                  </button>
                ) : (
                  <strong>{event.hostUsername || "Unknown"}</strong>
                )}
              </div>
              <div>
                <span>Max attendees</span>
                <strong>{event.maxAttendees || "No limit"}</strong>
              </div>
            </div>

            {canViewPrivateDetails ? (
              <>
                <div className="event-location-box">
                  <FontAwesomeIcon icon={faLocationDot} />
                  <div>
                    <span>{event.city ? `Location in ${event.city}` : "Location"}</span>
                    <strong>{event.location || "Location not provided"}</strong>
                    {mapUrl && (
                      <a href={mapUrl} target="_blank" rel="noreferrer">
                        Open map
                      </a>
                    )}
                  </div>
                </div>

                <div className="event-attendees">
                  <h4>
                    <FontAwesomeIcon icon={faUsers} /> Attendees
                  </h4>
                  {attendees.length > 0 ? (
                    attendees.map((attendee, index) => {
                      const attendeeProfile = getAttendeeProfile(attendee);

                      return (
                        <button
                          key={`${attendeeProfile.id}-${index}`}
                          className="event-attendee-row"
                          onClick={() =>
                            attendeeProfile.id &&
                            setProfilePreview({
                              userId: attendeeProfile.id,
                              username: attendeeProfile.username,
                            })
                          }
                          disabled={!attendeeProfile.id}
                        >
                          <img
                            src={attendeeProfile.profilePictureUrl || DEFAULT_PROFILE_PICTURE_URL}
                            alt={attendeeProfile.username}
                          />
                          <div>
                            <strong>{attendeeProfile.username}</strong>
                            <span>
                              {[
                                attendeeProfile.firstName,
                                attendeeProfile.lastName,
                              ]
                                .filter(Boolean)
                                .join(" ") || "Guest"}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <p className="events-muted">No attendees yet.</p>
                  )}
                </div>
              </>
            ) : (
              <div className="event-private-details">
                Event details are visible after your request is accepted.
              </div>
            )}
          </div>
        ) : (
          <div className="events-empty">Event could not be loaded.</div>
        )}
      </div>

      {profilePreview && (
        <EventApplicantProfileModal
          userId={profilePreview.userId}
          fallbackUsername={profilePreview.username}
          onClose={() => setProfilePreview(null)}
        />
      )}
    </div>
  );
};

export default EventDetailsModal;
