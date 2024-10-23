import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";

const app = express();
const server = createServer(app);
const io = new Server(server);

// 사용자 ID와 socketID를 매핑하는 객체
const userSocketMap = {};

io.on("connection", (socket) => {
  console.log("🚀 소켓이 연결되었습니다:", socket.id);

  // 대기실 입장 처리
  socket.on("waiting", (userName) => handleWaiting(socket, userName));

  // WebRTC 시그널링 처리
  socket.on("offer", ({ to, offer }) => handleOffer(socket, to, offer));
  socket.on("answer", (answer) => handleAnswer(socket, answer));
  socket.on("sdpDone", ({ to }) => handleSdpDone(socket, to));
  socket.on("ice", (candidate) => handleIceCandidate(socket, candidate));

  // 연결 해제 처리
  socket.on("disconnect", () => handleDisconnect(socket));
});

function handleWaiting(socket, userName) {
  userSocketMap[userName] = socket.id;
  socket.userName = userName;
  socket.join("waiting");
  io.in("waiting").emit("userUpdate", Object.keys(userSocketMap));
}

function handleOffer(socket, to, offer) {
  const signalingRoom = uuidv4();
  socket.signalingRoom = signalingRoom;
  socket.join(signalingRoom);

  const calleeSocketId = userSocketMap[to];
  const calleeSocket = io.sockets.sockets.get(calleeSocketId);
  calleeSocket.signalingRoom = signalingRoom;

  if (calleeSocket) {
    calleeSocket.join(signalingRoom);
    calleeSocket.emit("offer", offer);
  }
}

function handleAnswer(socket, answer) {
  socket.to(socket.signalingRoom).emit("answer", answer);
}

function handleIceCandidate(socket, candidate) {
  socket.to(socket.signalingRoom).emit("ice", candidate);
}

function handleDisconnect(socket) {
  const userId = Object.keys(userSocketMap).find(
    (key) => userSocketMap[key] === socket.id
  );
  if (userId) {
    delete userSocketMap[userId];
    socket.to("waiting").emit("userUpdate", Object.keys(userSocketMap));
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);
});
