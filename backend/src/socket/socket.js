const { Server } = require("socket.io");

let io;

// Track connected users.
// userId -> Set of socket IDs
const onlineUsers = new Map();

// Track which workspaces each socket has joined.
// socketId -> Set of workspace IDs
const socketWorkspaces = new Map();

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socketWorkspaces.set(socket.id, new Set());

    socket.on("join-user", (userId) => {
      if (!userId) {
        return;
      }

      const userIdString = userId.toString();

      if (!onlineUsers.has(userIdString)) {
        onlineUsers.set(userIdString, new Set());
      }

      onlineUsers.get(userIdString).add(socket.id);

      socket.data.userId = userIdString;

      socket.join(`user:${userIdString}`);

      console.log(
        `User ${userIdString} joined their notification room`
      );
    });

    socket.on("join-workspace", (workspaceId) => {
      if (!workspaceId) {
        return;
      }

      const workspaceIdString =
        workspaceId.toString();

      socket.join(
        `workspace:${workspaceIdString}`
      );

      socketWorkspaces
        .get(socket.id)
        ?.add(workspaceIdString);

      console.log(
        `Socket ${socket.id} joined workspace ${workspaceIdString}`
      );

      const currentOnlineUsers =
        Array.from(onlineUsers.keys());

      io.to(`workspace:${workspaceIdString}`).emit(
        "workspace-presence",
        {
          workspaceId: workspaceIdString,
          onlineUsers: currentOnlineUsers,
        }
      );
    });

    socket.on("leave-workspace", (workspaceId) => {
      if (!workspaceId) {
        return;
      }

      const workspaceIdString =
        workspaceId.toString();

      socket.leave(
        `workspace:${workspaceIdString}`
      );

      socketWorkspaces
        .get(socket.id)
        ?.delete(workspaceIdString);

      console.log(
        `Socket ${socket.id} left workspace ${workspaceIdString}`
      );
    });

    socket.on("disconnect", () => {
      console.log(
        `Socket disconnected: ${socket.id}`
      );

      const userId = socket.data.userId;

      // Remove the socket from workspace tracking.
      const joinedWorkspaces =
        socketWorkspaces.get(socket.id);

      socketWorkspaces.delete(socket.id);

      if (!userId) {
        return;
      }

      const userSockets =
        onlineUsers.get(userId);

      if (!userSockets) {
        return;
      }

      userSockets.delete(socket.id);

      // User is still online if another browser/tab
      // socket is connected.
      if (userSockets.size > 0) {
        return;
      }

      onlineUsers.delete(userId);

      // Notify only workspaces that this socket
      // was actually connected to.
      if (joinedWorkspaces) {
        joinedWorkspaces.forEach(
          (workspaceId) => {
            io.to(`workspace:${workspaceId}`).emit(
              "user-offline",
              {
                workspaceId,
                userId,
              }
            );
          }
        );
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error(
      "Socket.IO has not been initialized"
    );
  }

  return io;
};

const emitToWorkspace = (
  workspaceId,
  event,
  data
) => {
  if (!io) {
    console.error(
      "Socket.IO has not been initialized. Event was not emitted."
    );
    return;
  }

  io.to(`workspace:${workspaceId}`).emit(
    event,
    data
  );
};

module.exports = {
  initializeSocket,
  getIO,
  emitToWorkspace,
};