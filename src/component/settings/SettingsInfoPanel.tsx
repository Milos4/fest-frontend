import React from "react";
import "./changePassword.css";

interface SettingsInfoPanelProps {
  title: string;
  paragraphs: string[];
  isVisible: boolean;
  onBack: () => void;
}

const SettingsInfoPanel: React.FC<SettingsInfoPanelProps> = ({
  title,
  paragraphs,
  isVisible,
  onBack,
}) => {
  return (
    <div className={`change-password-container ${isVisible ? "visible" : ""}`}>
      <div className="change-password-card">
        <div className="change-password-header">
          <h2>{title}</h2>
          <button
            type="button"
            className="change-password-back"
            onClick={onBack}
          >
            Back
          </button>
        </div>

        <div className="settings-info-body">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="settings-info-text">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsInfoPanel;
