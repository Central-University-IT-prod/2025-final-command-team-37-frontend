import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthProvider from "./AuthProvider";
import MainPage from "./pages/MainPage";
import UserSpacePage from "./pages/UserSpacePage";
import AdminSpacePage from "./pages/AdminSpacePage";
import Header from "./components/Header/Header";
import AdminPanel from "./components/AdminPanel/AdminPanel";
import UserProfile from "./components/UserProfile/UserProfile";
import useTelegramWebApp from "./hooks/useTelegramWebApp";
import "./index.css";

function App() {
  const { tg, isReady } = useTelegramWebApp();

  if (!isReady) {
    return <div>Loading...</div>;
  }

  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Header />
          <div className="container">
            <Routes>
              <Route path="/" element={<Navigate to="/main" replace />} />
              <Route path="/main" element={<MainPage />} />
              <Route path="/user-space/:coworkingId" element={<UserSpacePage />} />
              <Route path="/admin-space" element={<AdminPanel />} />
              <Route path="/admin-space/workspace" element={<AdminSpacePage />} />
              <Route path="/admin-space/workspace/add" element={<AdminSpacePage />} />
              <Route path="/profile" element={<UserProfile />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
