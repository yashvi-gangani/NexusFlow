import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import socket from "../services/socket";
import { useAuth } from "./AuthContext";
import api from "../services/api";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      socket.disconnect();
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const loadNotifications = async () => {
      try {
        const response = await api.get("/notifications");

        setNotifications(
          response.data.notifications ||
            response.data.data ||
            []
        );

        setUnreadCount(
          response.data.unreadCount || 0
        );
      } catch (error) {
        console.error(
          "Unable to load notifications:",
          error.message
        );
      }
    };

    loadNotifications();

    socket.connect();

    socket.emit("join-user", user._id);

    const handleNotification = (notification) => {
      setNotifications((current) => [
        notification,
        ...current,
      ]);

      setUnreadCount((current) => current + 1);
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off(
        "notification",
        handleNotification
      );

      socket.disconnect();
    };
  }, [user]);

  const markAsRead = async (notificationId) => {
    try {
      await api.put(
        `/notifications/${notificationId}/read`
      );

      setNotifications((current) =>
        current.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );

      setUnreadCount((current) =>
        Math.max(0, current - 1)
      );
    } catch (error) {
      console.error(
        "Unable to mark notification as read:",
        error.message
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Unable to mark notifications as read:",
        error.message
      );
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () =>
  useContext(NotificationContext);