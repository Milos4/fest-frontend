import React, { useEffect, useState } from "react";
import logoImg from "../../images/logo.png";
import EventDetailsModal from "./EventDetailsModal";
import EventApplicantProfileModal from "./EventApplicantProfileModal";
import { EventJoinRequest, UserEvent } from "./eventTypes";
import "./events.css";

interface MyEventsProps {
  currentUserId: number;
}

const MyEvents: React.FC<MyEventsProps> = ({ currentUserId }) => {
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [requestsByEventId, setRequestsByEventId] = useState<{
    [eventId: number]: EventJoinRequest[];
  }>({});
  const [openEventId, setOpenEventId] = useState<number | null>(null);
  const [detailsEventId, setDetailsEventId] = useState<number | null>(null);
  const [profilePreview, setProfilePreview] = useState<{
    userId: number;
    username?: string;
  } | null>(null);
  const [actionRequestId, setActionRequestId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMyEvents = async () => {
      setIsLoading(true);

      try {
        const response = await fetch(
          `http://localhost:8080/api/user-events/my?hostUserId=${currentUserId}`
        );
        if (!response.ok) throw new Error("Failed to fetch my events");

        const data = await response.json();
        setEvents(
          [...data].sort(
            (a, b) =>
              new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
          )
        );
      } catch (error) {
        console.error("Error fetching my events:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUserId) {
      fetchMyEvents();
    }
  }, [currentUserId]);

  const formatDateTime = (value?: string) =>
    value
      ? new Date(value).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Not specified";

  const getApplicant = (request: EventJoinRequest) =>
    request.user || request.applicant || request.requester || request;

  const getApplicantId = (request: EventJoinRequest) =>
    request.user?.id ||
    request.applicant?.id ||
    request.requester?.id ||
    request.userId ||
    request.applicantId ||
    request.requesterId ||
    0;

  const getRequestId = (request: EventJoinRequest) =>
    request.id || request.requestId || 0;

  const handleApplicantProfileClick = (request: EventJoinRequest) => {
    const applicantId = getApplicantId(request);
    const applicant = getApplicant(request);

    if (applicantId) {
      setProfilePreview({
        userId: applicantId,
        username: applicant.username,
      });
    }
  };

  const fetchRequests = async (eventId: number) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/user-events/${eventId}/requests?hostUserId=${currentUserId}`
      );
      if (!response.ok) throw new Error("Failed to fetch event requests");

      const requests = await response.json();

      setRequestsByEventId((prev) => ({
        ...prev,
        [eventId]: requests,
      }));
    } catch (error) {
      console.error("Error fetching event requests:", error);
    }
  };

  const handleToggleRequests = (eventId: number) => {
    setOpenEventId((prev) => (prev === eventId ? null : eventId));

    if (!requestsByEventId[eventId]) {
      fetchRequests(eventId);
    }
  };

  const handleRequestAction = async (
    eventId: number,
    requestId: number,
    action: "accept" | "decline"
  ) => {
    setActionRequestId(requestId);

    try {
      const response = await fetch(
        `http://localhost:8080/api/user-events/requests/${requestId}/${action}?hostUserId=${currentUserId}`,
        { method: "POST" }
      );

      if (!response.ok) throw new Error(`Failed to ${action} request`);

      setRequestsByEventId((prev) => ({
        ...prev,
        [eventId]: (prev[eventId] || []).filter(
          (request) => getRequestId(request) !== requestId
        ),
      }));
    } catch (error) {
      console.error(`Error trying to ${action} event request:`, error);
    } finally {
      setActionRequestId(null);
    }
  };

  return (
    <div className="events-page">
      <div className="events-shell">
        <div className="events-title-row">
          <div>
            <h2>My Events</h2>
            <p>Manage your events and approve people who requested to join.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="events-empty">Loading your events...</div>
        ) : events.length === 0 ? (
          <div className="events-empty">You have not created any events yet.</div>
        ) : (
          <div className="my-events-list">
            {events.map((event) => (
              <section key={event.id} className="my-event-card">
                <div className="my-event-main">
                  <div>
                    <span className="event-type">{event.type}</span>
                    <h3>{event.name}</h3>
                    <p>{event.description}</p>
                    <div className="event-meta">
                      <span>Starts: {formatDateTime(event.startTime)}</span>
                      <span>Ends: {formatDateTime(event.endTime)}</span>
                      {event.city && <span>City: {event.city}</span>}
                      <span>Location: {event.location || "Not provided"}</span>
                    </div>
                  </div>
                  <div className="my-event-actions">
                    <button
                      className="event-button secondary"
                      onClick={() => setDetailsEventId(event.id)}
                    >
                      Details
                    </button>
                    <button
                      className="event-button"
                      onClick={() => handleToggleRequests(event.id)}
                    >
                      Requests
                    </button>
                  </div>
                </div>

                {openEventId === event.id && (
                  <div className="event-requests-panel">
                    {(requestsByEventId[event.id] || []).length === 0 ? (
                      <div className="events-empty small">
                        No pending requests for this event.
                      </div>
                    ) : (
                      requestsByEventId[event.id].map((request) => {
                        const applicant = getApplicant(request);
                        const requestId = getRequestId(request);

                        return (
                          <div key={requestId} className="event-request-row">
                            <button
                              className="event-request-avatar"
                              onClick={() => handleApplicantProfileClick(request)}
                              disabled={!getApplicantId(request)}
                            >
                              <img
                                src={applicant.profilePictureUrl || logoImg}
                                alt={applicant.username}
                              />
                            </button>
                            <div className="event-request-info">
                              <button
                                className="event-request-username"
                                onClick={() =>
                                  handleApplicantProfileClick(request)
                                }
                                disabled={!getApplicantId(request)}
                              >
                                {applicant.username}
                              </button>
                              <span>
                                {[applicant.firstName, applicant.lastName]
                                  .filter(Boolean)
                                  .join(" ") || "No name provided"}
                              </span>
                              <span>{applicant.location || "No location"}</span>
                              {request.message && <p>{request.message}</p>}
                            </div>
                            <div className="event-request-actions">
                              <button
                                className="event-button"
                                disabled={!requestId || actionRequestId === requestId}
                                onClick={() =>
                                  handleRequestAction(
                                    event.id,
                                    requestId,
                                    "accept"
                                  )
                                }
                              >
                                Accept
                              </button>
                              <button
                                className="event-button danger"
                                disabled={!requestId || actionRequestId === requestId}
                                onClick={() =>
                                  handleRequestAction(
                                    event.id,
                                    requestId,
                                    "decline"
                                  )
                                }
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>

      {detailsEventId && (
        <EventDetailsModal
          eventId={detailsEventId}
          currentUserId={currentUserId}
          onClose={() => setDetailsEventId(null)}
        />
      )}

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

export default MyEvents;
