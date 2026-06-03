import React, { useEffect, useState } from "react";
import EventDetailsModal from "./EventDetailsModal";
import { UserEvent } from "./eventTypes";
import "./events.css";

interface EventsListProps {
  currentUserId: number;
  onOpenMyEvents: () => void;
}

const EventsList: React.FC<EventsListProps> = ({
  currentUserId,
  onOpenMyEvents,
}) => {
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [activeTab, setActiveTab] = useState<"browse" | "accepted">("browse");
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [requestingEventId, setRequestingEventId] = useState<number | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);

      try {
        const response = await fetch(
          `http://localhost:8080/api/user-events?currentUserId=${currentUserId}`
        );
        if (!response.ok) throw new Error("Failed to fetch events");

        const data = await response.json();
        setEvents(
          [...data].sort(
            (a, b) =>
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          )
        );
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUserId) {
      fetchEvents();
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

  const knownCities = [
    { name: "Banja Luka", latitude: 44.7722, longitude: 17.191 },
    { name: "Sarajevo", latitude: 43.8563, longitude: 18.4131 },
    { name: "Mostar", latitude: 43.3438, longitude: 17.8078 },
    { name: "Tuzla", latitude: 44.5384, longitude: 18.6671 },
    { name: "Zenica", latitude: 44.2034, longitude: 17.9077 },
    { name: "Bijeljina", latitude: 44.7569, longitude: 19.2167 },
    { name: "Prijedor", latitude: 44.9799, longitude: 16.714 },
    { name: "Doboj", latitude: 44.7318, longitude: 18.0861 },
    { name: "Trebinje", latitude: 42.711, longitude: 18.3436 },
    { name: "Belgrade", latitude: 44.8125, longitude: 20.4612 },
    { name: "Novi Sad", latitude: 45.2671, longitude: 19.8335 },
    { name: "Nis", latitude: 43.3209, longitude: 21.8958 },
    { name: "Zagreb", latitude: 45.815, longitude: 15.9819 },
    { name: "Split", latitude: 43.5081, longitude: 16.4402 },
  ];

  const getEventCity = (event: UserEvent) => {
    if (event.city) return event.city;
    if (event.cityName) return event.cityName;
    if (event.eventCity) return event.eventCity;
    if (event.locationCity) return event.locationCity;

    if (event.latitude && event.longitude) {
      const matchedCity = knownCities.find(
        (city) =>
          Math.abs(Number(event.latitude) - city.latitude) < 0.02 &&
          Math.abs(Number(event.longitude) - city.longitude) < 0.02
      );

      if (matchedCity) return matchedCity.name;
    }

    if (!event.location) return "City not provided";

    const locationParts = event.location
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    return locationParts[locationParts.length - 1] || event.location;
  };

  const isHost = (event: UserEvent) =>
    event.hostUserId === currentUserId || event.hostUsername === "You";

  const acceptedEvents = events.filter(
    (event) => event.requestStatus === "ACCEPTED" && !isHost(event)
  );
  const browseEvents = events.filter(
    (event) => event.requestStatus !== "ACCEPTED" && !isHost(event)
  );
  const visibleEvents = activeTab === "accepted" ? acceptedEvents : browseEvents;

  const handleRequestJoin = async (eventId: number) => {
    setRequestingEventId(eventId);

    try {
      const response = await fetch(
        `http://localhost:8080/api/user-events/${eventId}/requests`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUserId,
            message: "",
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to request event");

      setEvents((prev) => prev.filter((event) => event.id !== eventId));
    } catch (error) {
      console.error("Error requesting event:", error);
    } finally {
      setRequestingEventId(null);
    }
  };

  const renderAction = (event: UserEvent) => {
    if (isHost(event)) {
      return (
        <button className="event-button secondary" onClick={onOpenMyEvents}>
          Manage event
        </button>
      );
    }

    if (event.requestStatus === "ACCEPTED") {
      return (
        <button
          className="event-button"
          onClick={() => setSelectedEventId(event.id)}
        >
          View details
        </button>
      );
    }

    if (event.requestStatus === "PENDING") {
      return (
        <button className="event-button muted" disabled>
          Requested
        </button>
      );
    }

    return (
      <button
        className="event-button"
        onClick={() => handleRequestJoin(event.id)}
        disabled={requestingEventId === event.id}
      >
        {requestingEventId === event.id ? "Sending..." : "Request to join"}
      </button>
    );
  };

  return (
    <div className="events-page">
      <div className="events-shell">
        <div className="events-title-row">
          <div>
            <h2>Events</h2>
            <p>Find events, request access, and view full details when accepted.</p>
          </div>
        </div>

        <div className="events-tabs">
          <button
            className={activeTab === "browse" ? "active" : ""}
            onClick={() => setActiveTab("browse")}
          >
            Browse events
            <span>{browseEvents.length}</span>
          </button>
          <button
            className={activeTab === "accepted" ? "active" : ""}
            onClick={() => setActiveTab("accepted")}
          >
            Accepted
            <span>{acceptedEvents.length}</span>
          </button>
        </div>

        {isLoading ? (
          <div className="events-empty">Loading events...</div>
        ) : visibleEvents.length === 0 ? (
          <div className="events-empty">
            {activeTab === "accepted"
              ? "You are not accepted to any events yet."
              : "No events available to request right now."}
          </div>
        ) : (
          <div className="events-grid">
            {visibleEvents.map((event) => (
              <article key={event.id} className="event-card">
                <div className="event-card-top">
                  <span className="event-type">{event.type}</span>
                  <span className="event-status">
                    {event.requestStatus || "OPEN"}
                  </span>
                </div>
                <h3>{event.name}</h3>
                <p className="event-description">{event.description}</p>
                <div className="event-meta">
                  <span>Starts: {formatDateTime(event.startTime)}</span>
                  <span>Ends: {formatDateTime(event.endTime)}</span>
                  <span>Host: {event.hostUsername || "Unknown"}</span>
                  <span>City: {getEventCity(event)}</span>
                  {event.canViewDetails && event.location && (
                    <span>Address: {event.location}</span>
                  )}
                </div>
                {renderAction(event)}
              </article>
            ))}
          </div>
        )}
      </div>

      {selectedEventId && (
        <EventDetailsModal
          eventId={selectedEventId}
          currentUserId={currentUserId}
          onClose={() => setSelectedEventId(null)}
        />
      )}
    </div>
  );
};

export default EventsList;
