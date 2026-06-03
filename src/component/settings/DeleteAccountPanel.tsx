import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./changePassword.css";

interface DeleteAccountPanelProps {
  isVisible: boolean;
  onBack: () => void;
}

const DeleteAccountPanel: React.FC<DeleteAccountPanelProps> = ({
  isVisible,
  onBack,
}) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const userId = userData.id;

  const handleDeleteAccount = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!userId) {
      setErrorMessage("User is not logged in.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to permanently delete your account?"
    );

    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`http://localhost:8080/api/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to delete account.");
      }

      setSuccessMessage("Account deleted successfully.");
      localStorage.clear();
      setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An error occurred while deleting the account.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`change-password-container ${isVisible ? "visible" : ""}`}>
      <div className="change-password-card">
        <div className="change-password-header">
          <h2>Delete Account</h2>
          <button
            type="button"
            className="change-password-back"
            onClick={onBack}
          >
            Back
          </button>
        </div>

        <div className="settings-info-body">
          <p className="settings-info-text danger-text">
            This action is permanent. Your profile, posts, and related account
            data may be removed once the backend endpoint is ready.
          </p>
          <p className="settings-info-text">
            For now the frontend sends a standard request to
            `DELETE /api/users/{userId}`.
          </p>

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
            type="button"
            className="delete-account-submit"
            onClick={handleDeleteAccount}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Deleting..." : "Delete Account"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountPanel;
