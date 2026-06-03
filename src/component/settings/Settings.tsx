import React from "react";
import { useNavigate } from "react-router-dom";
import "./settings.css";

type SettingsView = "change-password" | "privacy" | "help" | "delete-account";

interface SettingsProps {
  onSelectView: (view: SettingsView) => void;
}

const Settings: React.FC<SettingsProps> = ({ onSelectView }) => {
  const navigate = useNavigate();

  const handleOptionClick = (option: string) => {
    console.log(`Clicked on option: ${option}`);

    if (option === "Change Password") {
      onSelectView("change-password");
      return;
    }

    if (option === "Delete Account") {
      onSelectView("delete-account");
      return;
    }

    if (option === "Privacy") {
      onSelectView("privacy");
      return;
    }

    if (option === "Help") {
      onSelectView("help");
      return;
    }

    if (option === "Logout") {
      localStorage.clear();
      navigate("/");
    }
  };

  const options = [
    "Change Password",
    "Delete Account",
    "Privacy",
    "Help",
    "Logout",
  ];

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Settings</h2>
      </div>
      <div className="settings-body">
        {options.map((option, index) => (
          <div
            key={index}
            className="settings-option"
            onClick={() => handleOptionClick(option)}
          >
            {option}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Settings;
