const mongoose = require("mongoose");

const Workspace = require("../models/Workspace");
const User = require("../models/User");

// Create workspace
const createWorkspace = async (req, res) => {
  try {
    const { name, description = "" } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Workspace name is required",
      });
    }

    const workspace = await Workspace.create({
      name: name.trim(),
      description: description.trim(),
      owner: req.user.userId,
      members: [
        {
          user: req.user.userId,
          role: "owner",
        },
      ],
    });

    const populatedWorkspace = await Workspace.findById(workspace._id)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    res.status(201).json({
      success: true,
      message: "Workspace created successfully",
      workspace: populatedWorkspace,
    });
  } catch (error) {
    console.error("Create workspace error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while creating workspace",
    });
  }
};

// Get all workspaces for logged-in user
const getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      "members.user": req.user.userId,
    })
      .populate("owner", "name email")
      .populate("members.user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: workspaces.length,
      workspaces,
    });
  } catch (error) {
    console.error("Get workspaces error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while fetching workspaces",
    });
  }
};

// Get single workspace
const getWorkspace = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    const workspace = await Workspace.findOne({
      _id: id,
      "members.user": req.user.userId,
    })
      .populate("owner", "name email")
      .populate("members.user", "name email");

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    res.status(200).json({
      success: true,
      workspace,
    });
  } catch (error) {
    console.error("Get workspace error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while fetching workspace",
    });
  }
};

// Add member
const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role = "member" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Member email is required",
      });
    }

    if (!["admin", "member"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid member role",
      });
    }

    const workspace = await Workspace.findById(id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    const requester = workspace.members.find(
      (member) => member.user.toString() === req.user.userId
    );

    if (!requester || !["owner", "admin"].includes(requester.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to add members",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User with this email does not exist",
      });
    }

    const alreadyMember = workspace.members.some(
      (member) => member.user.toString() === user._id.toString()
    );

    if (alreadyMember) {
      return res.status(409).json({
        success: false,
        message: "User is already a workspace member",
      });
    }

    workspace.members.push({
      user: user._id,
      role,
    });

    await workspace.save();

    const updatedWorkspace = await Workspace.findById(id)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    res.status(200).json({
      success: true,
      message: "Member added successfully",
      workspace: updatedWorkspace,
    });
  } catch (error) {
    console.error("Add member error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while adding member",
    });
  }
};

// Remove member
const removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace or user ID",
      });
    }

    const workspace = await Workspace.findById(id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    const requester = workspace.members.find(
      (member) => member.user.toString() === req.user.userId
    );

    if (!requester || !["owner", "admin"].includes(requester.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to remove members",
      });
    }

    if (workspace.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "Workspace owner cannot be removed",
      });
    }

    const memberExists = workspace.members.some(
      (member) => member.user.toString() === userId
    );

    if (!memberExists) {
      return res.status(404).json({
        success: false,
        message: "User is not a workspace member",
      });
    }

    workspace.members = workspace.members.filter(
      (member) => member.user.toString() !== userId
    );

    await workspace.save();

    const updatedWorkspace = await Workspace.findById(id)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    res.status(200).json({
      success: true,
      message: "Member removed successfully",
      workspace: updatedWorkspace,
    });
  } catch (error) {
    console.error("Remove member error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while removing member",
    });
  }
};

module.exports = {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  addMember,
  removeMember,
};