const Notification = require("../models/Notification");
const { getIO } = require("../socket/socket");

const createNotification = async ({
  recipient,
  sender = null,
  workspace,
  task = null,
  type,
  message,
}) => {
  const notification = await Notification.create({
    recipient,
    sender,
    workspace,
    task,
    type,
    message,
  });

  const populatedNotification = await Notification.findById(notification._id)
    .populate("sender", "name email")
    .populate("task", "title")
    .populate("workspace", "name");

  // Send real-time notification to the recipient
  try {
    const io = getIO();

    io.to(`user:${recipient.toString()}`).emit(
      "notification",
      populatedNotification
    );
  } catch (error) {
    console.error("Socket notification error:", error.message);
  }

  return populatedNotification;
};

module.exports = { createNotification };