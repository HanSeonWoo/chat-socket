import { USER_STATUS, ROOM_NAMES } from "../utils/constants.js";

export class RoomManager {
  #io;
  #userSocketMap;
  #previousRoomList = [];

  constructor(io, userSocketMap) {
    this.#io = io;
    this.#userSocketMap = userSocketMap;
  }

  handleWaitingUpdate() {
    const waitingUsers = Array.from(this.#userSocketMap.entries())
      .filter(([_, info]) => info.status === USER_STATUS.WAITING)
      .map(([userName]) => userName);

    this.#io.to(ROOM_NAMES.WAITING).emit("userUpdate", waitingUsers);
  }

  handleRoomUpdate() {
    const rooms = this.#io.sockets.adapter.rooms;
    const currentRoomList = this.#getRoomList(rooms);

    // 현재 roomList와 이전 roomList를 문자열로 변환하여 비교
    const currentRoomListStr = JSON.stringify(currentRoomList);
    const previousRoomListStr = JSON.stringify(this.#previousRoomList);

    // 변경사항이 있을 때만 emit
    if (currentRoomListStr !== previousRoomListStr) {
      console.log(
        "🚀 ~ RoomManager ~ handleRoomUpdate ~ roomList:",
        currentRoomList
      );
      this.#io.to(ROOM_NAMES.ADMIN).emit("roomUpdate", currentRoomList);
      this.#previousRoomList = currentRoomList;
    }
  }

  #getRoomList(rooms) {
    const roomList = [];

    rooms.forEach((value, key) => {
      if (!value.has(key) && key !== "admin") {
        const socketIds = Array.from(value);
        const clients = socketIds.map((socketId) => {
          const user = Array.from(this.#userSocketMap.entries()).find(
            ([_, info]) => info.socketId === socketId
          );
          return user ? user[0] : socketId;
        });

        roomList.push({
          room: key,
          numberOfClients: value.size,
          clients,
        });
      }
    });
    return roomList;
  }
}
