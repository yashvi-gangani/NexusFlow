const mongoose = require("mongoose");

const Task = require("../models/Task");
const Workflow = require("../models/Workflow");
const Workspace = require("../models/Workspace");
const User = require("../models/User");

// Create task
const createTask = async (req, res) => {
  try {
    const { workflowId } = req.params;

    const {
      title,
      description = "",
      stage,
      assignedTo = null,
      priority = "MEDIUM",
      status = "TODO",
      dueDate = null,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(workflowId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workflow ID",
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(stage)) {
      return res.status(400).json({
        success: false,
        message: "Valid stage ID is required",
      });
    }

    const workflow = await Workflow.findById(workflowId);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: "Workflow not found",
      });
    }

    const workspace = await Workspace.findOne({
      _id: workflow.workspace,
      "members.user": req.user.userId,
    });

    if (!workspace) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this workflow",
      });
    }

    const stageExists = workflow.stages.some(
      (workflowStage) => workflowStage._id.toString() === stage
    );

    if (!stageExists) {
      return res.status(400).json({
        success: false,
        message: "Stage does not belong to this workflow",
      });
    }

    if (!["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task priority",
      });
    }

    if (!["TODO", "IN_PROGRESS", "REVIEW", "DONE"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task status",
      });
    }

    if (assignedTo) {
      if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
        return res.status(400).json({
          success: false,
          message: "Invalid assigned user ID",
        });
      }

      const assignedUser = await User.findById(assignedTo);

      if (!assignedUser) {
        return res.status(404).json({
          success: false,
          message: "Assigned user not found",
        });
      }

      const isWorkspaceMember = workspace.members.some(
        (member) => member.user.toString() === assignedTo
      );

      if (!isWorkspaceMember) {
        return res.status(400).json({
          success: false,
          message: "Assigned user is not a workspace member",
        });
      }
    }

    const task = await Task.create({
      title: title.trim(),
      description: description.trim(),
      workspace: workflow.workspace,
      workflow: workflowId,
      stage,
      assignedTo,
      priority,
      status,
      dueDate,
      createdBy: req.user.userId,
    });

    const populatedTask = await Task.findById(task._id)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("workflow", "name")
      .populate("workspace", "name");

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task: populatedTask,
    });
  } catch (error) {
    console.error("Create task error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while creating task",
    });
  }
};

// Get workflow tasks
const getWorkflowTasks = async (req, res) => {
  try {
    const { workflowId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(workflowId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workflow ID",
      });
    }

    const workflow = await Workflow.findById(workflowId);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: "Workflow not found",
      });
    }

    const workspace = await Workspace.findOne({
      _id: workflow.workspace,
      "members.user": req.user.userId,
    });

    if (!workspace) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this workflow",
      });
    }

    const tasks = await Task.find({
      workflow: workflowId,
    })
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("workflow", "name")
      .populate("workspace", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error("Get tasks error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while fetching tasks",
    });
  }
};

// Get single task
const getTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const task = await Task.findById(id)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("workflow", "name")
      .populate("workspace", "name");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const workspace = await Workspace.findOne({
      _id: task.workspace._id,
      "members.user": req.user.userId,
    });

    if (!workspace) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this task",
      });
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Get task error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while fetching task",
    });
  }
};

// Update task
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      priority,
      status,
      dueDate,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const task = await Task.findById(id);

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

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Task title cannot be empty",
        });
      }

      task.title = title.trim();
    }

    if (description !== undefined) {
      task.description = description.trim();
    }

    if (priority !== undefined) {
      if (!["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority)) {
        return res.status(400).json({
          success: false,
          message: "Invalid task priority",
        });
      }

      task.priority = priority;
    }

    if (status !== undefined) {
      if (!["TODO", "IN_PROGRESS", "REVIEW", "DONE"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid task status",
        });
      }

      task.status = status;
    }

    if (dueDate !== undefined) {
      task.dueDate = dueDate || null;
    }

    await task.save();

    const updatedTask = await Task.findById(id)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("workflow", "name")
      .populate("workspace", "name");

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update task error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while updating task",
    });
  }
};

// Move task to another stage
const moveTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(stage)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stage ID",
      });
    }

    const task = await Task.findById(id);

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

    const workflow = await Workflow.findById(task.workflow);

    const stageExists = workflow.stages.some(
      (workflowStage) => workflowStage._id.toString() === stage
    );

    if (!stageExists) {
      return res.status(400).json({
        success: false,
        message: "Stage does not belong to this workflow",
      });
    }

    task.stage = stage;

    await task.save();

    const updatedTask = await Task.findById(id)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("workflow", "name")
      .populate("workspace", "name");

    res.status(200).json({
      success: true,
      message: "Task moved successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Move task error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while moving task",
    });
  }
};

// Assign task
const assignTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const task = await Task.findById(id);

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

    const user = await User.findById(assignedTo);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMember = workspace.members.some(
      (member) => member.user.toString() === assignedTo
    );

    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: "User is not a workspace member",
      });
    }

    task.assignedTo = assignedTo;

    await task.save();

    const updatedTask = await Task.findById(id)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("workflow", "name")
      .populate("workspace", "name");

    res.status(200).json({
      success: true,
      message: "Task assigned successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Assign task error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while assigning task",
    });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const task = await Task.findById(id);

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

    await Task.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while deleting task",
    });
  }
};

module.exports = {
  createTask,
  getWorkflowTasks,
  getTask,
  updateTask,
  moveTask,
  assignTask,
  deleteTask,
};