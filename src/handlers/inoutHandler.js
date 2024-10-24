import { ROOM_NAMES, USER_STATUS } from "../utils/constants.js";

export class InoutHandler {
  constructor(io, userSocketMap, roomManager) {
    this.io = io;
    this.userSocketMap = userSocketMap;
    this.roomManager = roomManager;
  }

  handleWaiting(socket, userName) {
    console.log("🚀 ~ InoutHandler ~ handleWaiting ~ userName:", userName);
    this.userSocketMap.set(userName, {
      socketId: socket.id,
      status: USER_STATUS.WAITING,
      room: ROOM_NAMES.WAITING,
    });

    socket.userName = userName;
    socket.join(ROOM_NAMES.WAITING);
    this.roomManager.handleWaitingUpdate();
  }

  handleCallEnd(socket) {
    const userInfo = this.userSocketMap.get(socket.userName);
    if (!userInfo) return;

    this.endCall(socket, userInfo);
  }

  handleDisconnect(socket) {
    if (!socket.userName) return;
    console.log(
      "🚀 ~ InoutHandler ~ handleDisconnect ~ socket.userName:",
      socket.userName
    );

    const userInfo = this.userSocketMap.get(socket.userName);
    if (userInfo) {
      this.userSocketMap.delete(socket.userName);
      this.roomManager.handleWaitingUpdate();
    }
  }

  endCall(socket, userInfo) {
    const oldRoom = userInfo.room;

    userInfo.status = USER_STATUS.WAITING;
    userInfo.room = "waiting";

    socket.leave(oldRoom);
    socket.join("waiting");

    this.roomManager.handleWaitingUpdate();
  }
}
