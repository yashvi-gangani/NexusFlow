const express = require("express");

const {
  addComment,
  getTaskComments,
} = require("../controllers/commentController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/tasks/:taskId/comments", addComment);
router.get("/tasks/:taskId/comments", getTaskComments);

module.exports = router;