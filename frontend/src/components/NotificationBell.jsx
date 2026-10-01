import { useState } from "react";
import { useNotifications } from "../context/NotificationContext";

const NotificationBell = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "relative",
          fontSize: "18px",
        }}
      >
        🔔

        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-8px",
              right: "-8px",
              background: "red",
              color: "white",
              borderRadius: "50%",
              minWidth: "20px",
              height: "20px",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "45px",
            width: "350px",
            maxHeight: "450px",
            overflowY: "auto",
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "10px",
            padding: "15px",
            zIndex: 1000,
            boxShadow:
              "0 5px 20px rgba(0,0,0,0.15)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3>Notifications</h3>

            {unreadCount > 0 && (
              <button onClick={markAllAsRead}>
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p>No notifications.</p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() =>
                  !notification.isRead &&
                  markAsRead(notification._id)
                }
                style={{
                  padding: "12px",
                  marginTop: "10px",
                  borderRadius: "8px",
                  background: notification.isRead
                    ? "#f7f7f7"
                    : "#eef5ff",
                  cursor: notification.isRead
                    ? "default"
                    : "pointer",
                }}
              >
                <strong>
                  {notification.type}
                </strong>

                <p style={{ margin: "6px 0" }}>
                  {notification.message}
                </p>

                <small>
                  {new Date(
                    notification.createdAt
                  ).toLocaleString()}
                </small>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;