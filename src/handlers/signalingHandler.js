import { v4 as uuidv4 } from "uuid";
import { USER_STATUS } from "../utils/constants.js";

export class SignalingHandler {
  constructor(io, userSocketMap, roomManager) {
    this.io = io;
    this.userSocketMap = userSocketMap;
    this.roomManager = roomManager;
  }

  handleOffer(socket, to, offer) {
    const signalingRoom = uuidv4();
    const callerInfo = this.userSocketMap.get(socket.userName);
    const calleeInfo = this.userSocketMap.get(to);

    if (!calleeInfo || calleeInfo.status !== USER_STATUS.WAITING) {
      socket.emit("callFailed", { reason: "User unavailable" });
      return;
    }

    this.setupCall(socket, callerInfo, calleeInfo, signalingRoom, offer);
  }

  handleAnswer(socket, answer) {
    console.log(
      "🚀 ~ WebrtcHandler ~ handleAnswer ~ answer:",
      socket.signalingRoom
    );
    socket.to(socket.signalingRoom).emit("answer", answer);
  }

  handleIceCandidate(socket, candidate) {
    socket.to(socket.signalingRoom).emit("ice", candidate);
  }

  setupCall(socket, callerInfo, calleeInfo, signalingRoom, offer) {
    // 상태 업데이트
    callerInfo.status = USER_STATUS.IN_CALL;
    callerInfo.room = signalingRoom;
    calleeInfo.status = USER_STATUS.IN_CALL;
    calleeInfo.room = signalingRoom;
    socket.signalingRoom = signalingRoom;

    // room 이동
    socket.leave("waiting");
    socket.join(signalingRoom);

    const calleeSocket = this.io.sockets.sockets.get(calleeInfo.socketId);
    if (calleeSocket) {
      calleeSocket.signalingRoom = signalingRoom;
      calleeSocket.leave("waiting");
      calleeSocket.join(signalingRoom);
      calleeSocket.emit("offer", offer);
    }

    this.roomManager.handleWaitingUpdate();
  }
}
