import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { InoutHandler } from "./src/handlers/inoutHandler.js";
import { WebrtcHandler } from "./src/handlers/webrtcHandler.js";
import { RoomManager } from "./src/services/roomManager.js";
import { ROOM_NAMES } from "./src/utils/constants.js";

const app = express();
const server = createServer(app);
const io = new Server(server);

const userSocketMap = new Map(); // {userName: {socketId, status, room}}

const roomManager = new RoomManager(io, userSocketMap);
const webrtcHandler = new WebrtcHandler(io, userSocketMap, roomManager);
const inoutHandler = new InoutHandler(io, userSocketMap, roomManager);

io.on("connection", (socket) => {
  console.log("🚀 소켓이 연결되었습니다:", socket.id);

  // 대기실 입장 처리
  socket.on("waiting", (userName) =>
    inoutHandler.handleWaiting(socket, userName)
  );

  // WebRTC 시그널링 처리
  socket.on("offer", ({ to, offer }) =>
    webrtcHandler.handleOffer(socket, to, offer)
  );
  socket.on("answer", (answer) => webrtcHandler.handleAnswer(socket, answer));
  socket.on("ice", (candidate) =>
    webrtcHandler.handleIceCandidate(socket, candidate)
  );
  socket.on("callEnd", () => webrtcHandler.handleCallEnd(socket));

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
