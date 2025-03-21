import React from "react";
import { useNavigate } from "react-router-dom";
import "./settings.css";
import logoImg from "../../images/logo.png";

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const handleOptionClick = (option: string) => {
    console.log(`Clicked on option: ${option}`);
    // Ovde možeš dodati logiku za svaku opciju

    if (option === "Logout") {
      localStorage.clear();
      navigate("/");
    }
  };

  const options = [
    "Change Password",
    "Delete Account",
    "Notifications",
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
