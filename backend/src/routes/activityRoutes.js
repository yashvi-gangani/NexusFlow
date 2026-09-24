const express = require("express");

const {
  getWorkspaceActivity,
} = require("../controllers/activityController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/workspaces/:workspaceId/activity", getWorkspaceActivity);

module.exports = router;