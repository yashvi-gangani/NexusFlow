const Notification = require("../models/Notification");

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

  return Notification.findById(notification._id)
    .populate("sender", "name email")
    .populate("task", "title")
    .populate("workspace", "name");
};

module.exports = {
  createNotification,
};