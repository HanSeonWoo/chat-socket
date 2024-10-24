import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { InoutHandler } from "./src/handlers/inoutHandler.js";
import { SignalingHandler } from "./src/handlers/signalingHandler.js";
import { RoomManager } from "./src/services/roomManager.js";
import { ROOM_NAMES } from "./src/utils/constants.js";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://rtc-admin.vercel.app/",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const userSocketMap = new Map(); // {userName: {socketId, status, room}}

const roomManager = new RoomManager(io, userSocketMap);
const signalingHandler = new SignalingHandler(io, userSocketMap, roomManager);
const inoutHandler = new InoutHandler(io, userSocketMap, roomManager);

io.on("connection", (socket) => {
  console.log("🚀 소켓이 연결되었습니다:", socket.id);

  socket.on("admin", () => socket.join(ROOM_NAMES.ADMIN));
  socket.on("adminMessage", ({ roomName, message }) => {
    console.log("🚀 ~ socket.on ~ message:", roomName, message);
    socket.to(roomName).emit("adminMessage", message);
  });

  // 대기실 입장 처리
  socket.on("waiting", (userName) =>
    inoutHandler.handleWaiting(socket, userName)
  );
  socket.on("callEnd", () => inoutHandler.handleCallEnd(socket));

  // WebRTC 시그널링 처리
  socket.on("offer", ({ to, offer }) =>
    signalingHandler.handleOffer(socket, to, offer)
  );
  socket.on("answer", (answer) =>
    signalingHandler.handleAnswer(socket, answer)
  );
  socket.on("ice", (candidate) =>
    signalingHandler.handleIceCandidate(socket, candidate)
  );

  // 채팅 처리
  socket.on("chat", ({ from, message, timestamp }) =>
    handleChat(socket, from, message, timestamp)
  );

  // 연결 해제 처리
  socket.on("disconnect", () => inoutHandler.handleDisconnect(socket));
});

io.of("/").adapter.on("join-room", (room, id) => {
  if (room === ROOM_NAMES.WAITING) {
    roomManager.handleWaitingUpdate();
  }
  if (room !== id) {
    roomManager.handleRoomUpdate();
  }
});

io.of("/").adapter.on("leave-room", (room, id) => {
  if (room === ROOM_NAMES.WAITING) {
    roomManager.handleWaitingUpdate();
  }
  roomManager.handleRoomUpdate();
});

function handleChat(socket, from, message, timestamp) {
  io.in(socket.signalingRoom).emit("chat", { from, message, timestamp });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`서버가 실행 중입니다. :${PORT}`);
});
