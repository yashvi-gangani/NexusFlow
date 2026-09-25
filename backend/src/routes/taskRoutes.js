const express = require("express");

const {
  createTask,
  getWorkflowTasks,
  getTask,
  updateTask,
  moveTask,
  assignTask,
  deleteTask,
} = require("../controllers/taskController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/workflows/:workflowId/tasks", createTask);
router.get("/workflows/:workflowId/tasks", getWorkflowTasks);

router.get("/tasks/:id", getTask);
router.put("/tasks/:id", updateTask);
router.put("/tasks/:id/stage", moveTask);
router.put("/tasks/:id/assign", assignTask);
router.delete("/tasks/:id", deleteTask);

module.exports = router;