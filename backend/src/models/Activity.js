const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },

    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },

    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workflow",
      default: null,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    action: {
      type: String,
      required: true,
      enum: [
        "TASK_CREATED",
        "TASK_UPDATED",
        "TASK_ASSIGNED",
        "TASK_MOVED",
        "TASK_DELETED",
        "COMMENT_ADDED",
        "WORKFLOW_CREATED",
        "WORKFLOW_UPDATED",
      ],
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Activity", activitySchema);