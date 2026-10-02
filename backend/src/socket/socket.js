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

    socket.on("join-user", (userId) => {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined their notification room`);
    });

    socket.on("join-workspace", (workspaceId) => {
      socket.join(`workspace:${workspaceId}`);
      console.log(
        `Socket ${socket.id} joined workspace ${workspaceId}`
      );
    });

    socket.on("leave-workspace", (workspaceId) => {
      socket.leave(`workspace:${workspaceId}`);
      console.log(
        `Socket ${socket.id} left workspace ${workspaceId}`
      );
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

const emitToWorkspace = (workspaceId, event, data) => {
  if (!io) {
    console.error(
      "Socket.IO has not been initialized. Event was not emitted."
    );
    return;
  }

  io.to(`workspace:${workspaceId}`).emit(event, data);
};

module.exports = {
  initializeSocket,
  getIO,
  emitToWorkspace,
};