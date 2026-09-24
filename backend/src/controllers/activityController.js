const mongoose = require("mongoose");

const Activity = require("../models/Activity");
const Workspace = require("../models/Workspace");

const getWorkspaceActivity = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": req.user.userId,
    });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    const activities = await Activity.find({
      workspace: workspaceId,
    })
      .populate("user", "name email")
      .populate("task", "title")
      .populate("workflow", "name")
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error("Get activity error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while fetching activity",
    });
  }
};

module.exports = {
  getWorkspaceActivity,
};