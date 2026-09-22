const express = require("express");

const {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  addMember,
  removeMember,
} = require("../controllers/workspaceController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", createWorkspace);
router.get("/", getWorkspaces);
router.get("/:id", getWorkspace);
router.post("/:id/members", addMember);
router.delete("/:id/members/:userId", removeMember);

module.exports = router;