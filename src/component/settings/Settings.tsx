import React from "react";
import { logout } from "../../api";
import "./settings.css";

type SettingsView = "change-password" | "privacy" | "help" | "delete-account";

interface SettingsProps {
  onSelectView: (view: SettingsView) => void;
}

const Settings: React.FC<SettingsProps> = ({ onSelectView }) => {
  /** Sve odjave gase serversku sesiju prije povratka na login. */
  const handleOptionClick = async (option: string) => {
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
      try { await logout(); }
      catch { alert("Logout failed. Please try again."); }
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
