import React from 'react';
import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem("authToken") || null);
  const [userProfile, setUserProfile] = useState(JSON.parse(sessionStorage.getItem("userProfile")) || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const initData = tg?.initDataUnsafe || new URLSearchParams(window.location.search);
    
    console.log("InitData:", initData);
    console.log("User ID:", initData?.user?.id);

    if (!initData?.user?.id) {
      console.log("Нет ID пользователя, авторизация прервана");
      setLoading(false);
      return;
    }

    const userData = {
      id: initData.user.id,
      first_name: initData.user.first_name || "",
      last_name: initData.user.last_name || "",
      username: initData.user.username || "",
      photo_url: initData.user.photo_url || "",
      auth_date: initData.auth_date,
      hash: initData.hash,
    };

    console.log("Отправляем данные для авторизации:", userData);

    fetch("https://prod-team-37-ajc3mefd.REDACTED/api/v1/user/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Ответ от сервера авторизации:", data);
        if (data?.token) {
          console.log("Токен получен, сохраняем в sessionStorage");
          sessionStorage.setItem("authToken", data.token);
          setToken(data.token);
          
          setUser({
            ...userData,
            token: data.token
          });
          
          fetchUserProfile(data.token);
        } else {
          console.log("Токен не получен в ответе");
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("Ошибка при авторизации:", error);
        setLoading(false);
      });
  }, []);
  
  const fetchUserProfile = (authToken) => {
    fetch("https://prod-team-37-ajc3mefd.REDACTED/api/v1/user/profile", {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      }
    })
      .then((res) => res.json())
      .then((profileData) => {
        if (profileData) {
          sessionStorage.setItem("userProfile", JSON.stringify(profileData));
          setUserProfile(profileData);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Ошибка при получении профиля:", error);
        setLoading(false);
      });
  };

  const getAuthHeaders = () => {
    return token ? { "Authorization": `Bearer ${token}` } : {};
  };

  const isAdmin = userProfile?.role === "ADMIN";

  return (
    <AuthContext.Provider value={{ user, token, userProfile, loading, isAdmin, getAuthHeaders }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
