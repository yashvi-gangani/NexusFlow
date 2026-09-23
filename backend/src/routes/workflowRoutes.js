const express = require("express");

const {
  createWorkflow,
  getWorkflows,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  addStage,
  removeStage,
} = require("../controllers/workflowController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

// Workspace workflows
router.post("/workspaces/:workspaceId/workflows", createWorkflow);
router.get("/workspaces/:workspaceId/workflows", getWorkflows);

// Individual workflow
router.get("/workflows/:id", getWorkflow);
router.put("/workflows/:id", updateWorkflow);
router.delete("/workflows/:id", deleteWorkflow);

// Workflow stages
router.post("/workflows/:id/stages", addStage);
router.delete("/workflows/:id/stages/:stageId", removeStage);

module.exports = router;