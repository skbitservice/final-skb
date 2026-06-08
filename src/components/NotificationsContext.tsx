import React, { createContext, useContext, useState, useEffect } from "react";
import { PushNotification } from "../types";

interface NotificationsContextData {
  notifications: PushNotification[];
  unreadCount: number;
  triggerNotification: (title: string, body: string, type?: "order" | "ticket" | "system") => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationsContext = createContext<NotificationsContextData | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<PushNotification[]>(() => {
    const saved = localStorage.getItem("skb-notifications");
    return saved ? JSON.parse(saved) : [];
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    localStorage.setItem("skb-notifications", JSON.stringify(notifications));
  }, [notifications]);

  const triggerNotification = (title: string, body: string, type: "order" | "ticket" | "system" = "order") => {
    const newNotif: PushNotification = {
      id: `NOTIF-${Date.now()}`,
      title,
      body,
      type,
      read: false,
      timestamp: new Date().toISOString(),
    };

    setNotifications((prev) => [newNotif, ...prev]);

    // Native browser notification support
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    }

    // Play a friendly haptic sound using synthesized oscillator audio
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 prime
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5 major
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      // Audio context error or blocked by autoplay policy
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Request browser permissions automatically
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        triggerNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
};
