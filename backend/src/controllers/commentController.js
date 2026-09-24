const mongoose = require("mongoose");

const Comment = require("../models/Comment");
const Task = require("../models/Task");
const Workspace = require("../models/Workspace");

const addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const workspace = await Workspace.findOne({
      _id: task.workspace,
      "members.user": req.user.userId,
    });

    if (!workspace) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this task",
      });
    }

    const comment = await Comment.create({
      task: taskId,
      user: req.user.userId,
      text: text.trim(),
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate("user", "name email");

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: populatedComment,
    });
  } catch (error) {
    console.error("Add comment error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while adding comment",
    });
  }
};

const getTaskComments = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const workspace = await Workspace.findOne({
      _id: task.workspace,
      "members.user": req.user.userId,
    });

    if (!workspace) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this task",
      });
    }

    const comments = await Comment.find({
      task: taskId,
    })
      .populate("user", "name email")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    console.error("Get comments error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while fetching comments",
    });
  }
};

module.exports = {
  addComment,
  getTaskComments,
};