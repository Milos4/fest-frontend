import React from "react";
import LoginPage from "./page/LoginPage";
import HomePage from "./page/HomePage";
import ProfilePage from "./page/ProfilePage";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import RequireSession from "./RequireSession";
import AdminPage from "./page/AdminPage";
import { useCurrentUserPresence } from "./component/messages/presence";

const PresenceBoot: React.FC = () => {
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  useCurrentUserPresence(Number(userData.id) || null);

  return null;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RequireSession guest><LoginPage /></RequireSession>} />
        <Route path="/login" element={<RequireSession guest><LoginPage /></RequireSession>} />
        <Route path="/home" element={<RequireSession><PresenceBoot /><HomePage /></RequireSession>} />
        <Route path="/profile/:userId" element={<RequireSession><PresenceBoot /><ProfilePage /></RequireSession>} />
        <Route path="/admin/*" element={<RequireSession admin><AdminPage /></RequireSession>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
