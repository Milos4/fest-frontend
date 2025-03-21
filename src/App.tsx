import React from "react";
import LoginPage from "./page/LoginPage";
import HomePage from "./page/HomePage";
import ProfilePage from "./page/ProfilePage";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />}></Route>
        <Route path="/home" element={<HomePage />}></Route>
        <Route path="/profile/:userId" element={<ProfilePage />} />
      </Routes>
    </Router>
  );
};

export default App;
