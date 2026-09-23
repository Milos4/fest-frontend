import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

interface ReportPostModalProps {
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

const reportReasons = [
  "Spam or misleading",
  "Hate or harassment",
  "Violence or dangerous content",
  "Nudity or sexual content",
  "Other",
];

const ReportPostModal: React.FC<ReportPostModalProps> = ({
  onClose,
  onSubmit,
}) => {
  const [selectedReason, setSelectedReason] = useState(reportReasons[0]);
  const [isReported, setIsReported] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Potvrdu prikazuje tek nakon uspjesnog cuvanja; greska dozvoljava ponovni pokusaj.
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      await onSubmit(selectedReason);
      setIsReported(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Report could not be saved");
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="post-popup-overlay" onClick={onClose}>
      <div className="report-popup-card" onClick={(e) => e.stopPropagation()}>
        <div className="report-popup-header">
          <div>
            <h3>Report post</h3>
            <p>Select a reason for reporting this post.</p>
          </div>
          <button className="post-popup-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {isReported ? (
          <div className="report-success">
            <h4>Reported</h4>
            <p>Thank you. This post has been reported.</p>
            <button className="report-submit" onClick={onClose}>
              OK
            </button>
          </div>
        ) : (
          <>
            <div className="report-reasons">
              {reportReasons.map((reason) => (
                <label key={reason} className="report-reason">
                  <input
                    type="radio"
                    name="report-reason"
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="report-actions">
              {error && <p role="alert">{error}</p>}
              <button className="report-cancel" onClick={onClose}>
                Cancel
              </button>
              <button className="report-submit" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Sending…" : "Report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportPostModal;
