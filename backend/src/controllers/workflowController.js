const mongoose = require("mongoose");

const Workflow = require("../models/Workflow");
const Workspace = require("../models/Workspace");

// Create workflow
const createWorkflow = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, description = "" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Workflow name is required",
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

    const workflow = await Workflow.create({
      name: name.trim(),
      description: description.trim(),
      workspace: workspaceId,
      createdBy: req.user.userId,
    });

    const populatedWorkflow = await Workflow.findById(workflow._id)
      .populate("workspace", "name")
      .populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      message: "Workflow created successfully",
      workflow: populatedWorkflow,
    });
  } catch (error) {
    console.error("Create workflow error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while creating workflow",
    });
  }
};

// Get workflows for workspace
const getWorkflows = async (req, res) => {
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

    const workflows = await Workflow.find({
      workspace: workspaceId,
    })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: workflows.length,
      workflows,
    });
  } catch (error) {
    console.error("Get workflows error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while fetching workflows",
    });
  }
};

// Get single workflow
const getWorkflow = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workflow ID",
      });
    }

    const workflow = await Workflow.findById(id)
      .populate("workspace", "name")
      .populate("createdBy", "name email");

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: "Workflow not found",
      });
    }

    const isMember = await Workspace.exists({
      _id: workflow.workspace._id,
      "members.user": req.user.userId,
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this workflow",
      });
    }

    res.status(200).json({
      success: true,
      workflow,
    });
  } catch (error) {
    console.error("Get workflow error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while fetching workflow",
    });
  }
};

// Update workflow
const updateWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workflow ID",
      });
    }

    const workflow = await Workflow.findById(id);

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

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Workflow name cannot be empty",
        });
      }

      workflow.name = name.trim();
    }

    if (description !== undefined) {
      workflow.description = description.trim();
    }

    if (status !== undefined) {
      if (!["active", "archived"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid workflow status",
        });
      }

      workflow.status = status;
    }

    await workflow.save();

    const updatedWorkflow = await Workflow.findById(id)
      .populate("workspace", "name")
      .populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      message: "Workflow updated successfully",
      workflow: updatedWorkflow,
    });
  } catch (error) {
    console.error("Update workflow error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while updating workflow",
    });
  }
};

// Delete workflow
const deleteWorkflow = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workflow ID",
      });
    }

    const workflow = await Workflow.findById(id);

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

    await Workflow.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Workflow deleted successfully",
    });
  } catch (error) {
    console.error("Delete workflow error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while deleting workflow",
    });
  }
};

// Add stage
const addStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description = "" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workflow ID",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Stage name is required",
      });
    }

    const workflow = await Workflow.findById(id);

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

    workflow.stages.push({
      name: name.trim(),
      description: description.trim(),
      order: workflow.stages.length,
    });

    await workflow.save();

    res.status(201).json({
      success: true,
      message: "Stage added successfully",
      workflow,
    });
  } catch (error) {
    console.error("Add stage error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while adding stage",
    });
  }
};

// Remove stage
const removeStage = async (req, res) => {
  try {
    const { id, stageId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(stageId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid workflow or stage ID",
      });
    }

    const workflow = await Workflow.findById(id);

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
      (stage) => stage._id.toString() === stageId
    );

    if (!stageExists) {
      return res.status(404).json({
        success: false,
        message: "Stage not found",
      });
    }

    workflow.stages = workflow.stages
      .filter((stage) => stage._id.toString() !== stageId)
      .map((stage, index) => ({
        ...stage.toObject(),
        order: index,
      }));

    await workflow.save();

    res.status(200).json({
      success: true,
      message: "Stage removed successfully",
      workflow,
    });
  } catch (error) {
    console.error("Remove stage error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while removing stage",
    });
  }
};

module.exports = {
  createWorkflow,
  getWorkflows,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  addStage,
  removeStage,
};