import React, { useState } from "react";
import "./events.css";

interface CreateEventProps {
  currentUserId: number;
  onCreated: () => void;
}

const initialForm = {
  name: "",
  description: "",
  startTime: "",
  endTime: "",
  city: "",
  address: "",
  latitude: "",
  longitude: "",
  maxAttendees: "",
  type: "PUBLIC",
};

const cityOptions = [
  { name: "Banja Luka", latitude: "44.7722", longitude: "17.1910" },
  { name: "Sarajevo", latitude: "43.8563", longitude: "18.4131" },
  { name: "Mostar", latitude: "43.3438", longitude: "17.8078" },
  { name: "Tuzla", latitude: "44.5384", longitude: "18.6671" },
  { name: "Zenica", latitude: "44.2034", longitude: "17.9077" },
  { name: "Bijeljina", latitude: "44.7569", longitude: "19.2167" },
  { name: "Prijedor", latitude: "44.9799", longitude: "16.7140" },
  { name: "Doboj", latitude: "44.7318", longitude: "18.0861" },
  { name: "Trebinje", latitude: "42.7110", longitude: "18.3436" },
  { name: "Belgrade", latitude: "44.8125", longitude: "20.4612" },
  { name: "Novi Sad", latitude: "45.2671", longitude: "19.8335" },
  { name: "Nis", latitude: "43.3209", longitude: "21.8958" },
  { name: "Zagreb", latitude: "45.8150", longitude: "15.9819" },
  { name: "Split", latitude: "43.5081", longitude: "16.4402" },
];

const CreateEvent: React.FC<CreateEventProps> = ({ currentUserId, onCreated }) => {
  const [form, setForm] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCityChange = (cityName: string) => {
    const selectedCity = cityOptions.find((city) => city.name === cityName);

    setForm((prev) => ({
      ...prev,
      city: cityName,
      latitude: selectedCity?.latitude || "",
      longitude: selectedCity?.longitude || "",
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const fullLocation = [form.address.trim(), form.city]
        .filter(Boolean)
        .join(", ");

      const response = await fetch("http://localhost:8080/api/user-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostUserId: currentUserId,
          name: form.name.trim(),
          description: form.description.trim(),
          startTime: form.startTime,
          endTime: form.endTime,
          city: form.city,
          location: fullLocation,
          latitude: form.latitude ? Number(form.latitude) : null,
          longitude: form.longitude ? Number(form.longitude) : null,
          maxAttendees: form.maxAttendees ? Number(form.maxAttendees) : null,
          type: form.type,
        }),
      });

      if (!response.ok) throw new Error("Failed to create event");

      setForm(initialForm);
      setMessage("Event created successfully.");
      onCreated();
    } catch (error) {
      console.error("Error creating event:", error);
      setMessage("Could not create event. Check the fields and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="events-page">
      <form className="event-form" onSubmit={handleSubmit}>
        <div className="events-title-row">
          <div>
            <h2>Create Event</h2>
            <p>Set up the event and decide who can request to join.</p>
          </div>
        </div>

        <div className="event-form-grid">
          <label>
            Event name
            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
            />
          </label>
          <label>
            Type
            <select
              value={form.type}
              onChange={(e) => updateField("type", e.target.value)}
            >
              <option value="SPORT">Sport</option>
              <option value="PUBLIC">Public</option>
              <option value="MUSIC">Music</option>
              <option value="GAME_NIGHT">Game Night</option>
              <option value="MEETUP">Meetup</option>
            </select>
          </label>
          <label className="event-form-wide">
            Description
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              required
            />
          </label>
          <label>
            Start time
            <input
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => updateField("startTime", e.target.value)}
              required
            />
          </label>
          <label>
            End time
            <input
              type="datetime-local"
              value={form.endTime}
              onChange={(e) => updateField("endTime", e.target.value)}
              required
            />
          </label>
          <label>
            City
            <select
              value={form.city}
              onChange={(e) => handleCityChange(e.target.value)}
              required
            >
              <option value="">Select city</option>
              {cityOptions.map((city) => (
                <option key={city.name} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Address / venue
            <input
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="Street, club, hall, park..."
              required
            />
          </label>
          <div className="event-coordinates event-form-wide">
            <span>Coordinates</span>
            <strong>
              {form.latitude && form.longitude
                ? `${form.latitude}, ${form.longitude}`
                : "Select a city to fill coordinates automatically"}
            </strong>
          </div>
          <label>
            Max attendees
            <input
              type="number"
              min="1"
              value={form.maxAttendees}
              onChange={(e) => updateField("maxAttendees", e.target.value)}
            />
          </label>
        </div>

        {message && <div className="event-form-message">{message}</div>}

        <button className="event-button event-form-submit" disabled={isSaving}>
          {isSaving ? "Creating..." : "Create event"}
        </button>
      </form>
    </div>
  );
};

export default CreateEvent;
