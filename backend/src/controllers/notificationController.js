const Notification = require("../models/Notification");

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user.userId,
    })
      .populate("sender", "name email")
      .populate("task", "title")
      .populate("workspace", "name")
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user.userId,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while fetching notifications",
    });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        recipient: req.user.userId,
      },
      {
        isRead: true,
      },
      {
        new: true,
      }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Mark notification error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while updating notification",
    });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user.userId,
        isRead: false,
      },
      {
        isRead: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all notifications error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while updating notifications",
    });
  }
};

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};