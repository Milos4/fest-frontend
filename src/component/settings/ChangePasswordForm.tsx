import React, { useState } from "react";
import "./changePassword.css";

interface ChangePasswordFormProps {
  isVisible: boolean;
  onBack: () => void;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  isVisible,
  onBack,
}) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const userId = userData.id;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!userId) {
      setErrorMessage("User is not logged in.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage("New passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `http://localhost:8080/api/users/${userId}/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            oldPassword,
            newPassword,
            confirmNewPassword,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to change password.");
      }

      setSuccessMessage("Password changed successfully.");
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An error occurred while changing the password.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`change-password-container ${isVisible ? "visible" : ""}`}
    >
      <div className="change-password-card">
        <div className="change-password-header">
          <h2>Change Password</h2>
          <button
            type="button"
            className="change-password-back"
            onClick={onBack}
          >
            Back
          </button>
        </div>

        <form className="change-password-form" onSubmit={handleSubmit}>
          <div className="change-password-field">
            <label htmlFor="oldPassword">Current Password</label>
            <input
              id="oldPassword"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>

          <div className="change-password-field">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="change-password-field">
            <label htmlFor="confirmNewPassword">Confirm New Password</label>
            <input
              id="confirmNewPassword"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />
          </div>

          {errorMessage && (
            <div className="change-password-message error-message">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="change-password-message success-message">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            className="change-password-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordForm;
