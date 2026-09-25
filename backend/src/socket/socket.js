const { Server } = require("socket.io");

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("join-workspace", (workspaceId) => {
      socket.join(`workspace:${workspaceId}`);
    });

    socket.on("leave-workspace", (workspaceId) => {
      socket.leave(`workspace:${workspaceId}`);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
};

module.exports = {
  initializeSocket,
  getIO,
};