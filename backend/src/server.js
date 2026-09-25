const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");

const { initializeSocket } = require("./socket/socket");

const connectDB = require("./config/db");
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const workflowRoutes = require("./routes/workflowRoutes");
const commentRoutes = require("./routes/commentRoutes");
const activityRoutes = require("./routes/activityRoutes");
const taskRoutes = require("./routes/taskRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api", workflowRoutes);
app.use("/api", commentRoutes);
app.use("/api", activityRoutes);
app.use("/api", taskRoutes);
app.use("/api/notifications", notificationRoutes);

const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);

  initializeSocket(server);

  server.listen(PORT, () => {
    console.log(`NexusFlow server running on port ${PORT}`);
  });
};

startServer();