import { io } from "socket.io-client";

let socket: any;

export const initSocket = (userId: string) => {
  if (!socket) {
    // In a real scenario, this would point to the server's socket endpoint
    socket = io({
      path: "/api/socket",
      query: { userId },
    });

    socket.on("connect", () => {
      console.log("Connected to collaboration server");
    });
  }
  return socket;
};

export const joinRoom = (roomId: string) => {
  if (socket) socket.emit("join-room", roomId);
};

export const sendUpdate = (roomId: string, update: any) => {
  if (socket) socket.emit("document-update", { roomId, update });
};

export const onUpdate = (callback: (update: any) => void) => {
  if (socket) socket.on("document-update", callback);
};
