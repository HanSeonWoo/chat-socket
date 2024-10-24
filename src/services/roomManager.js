import { USER_STATUS, ROOM_NAMES } from "../utils/constants.js";

export class RoomManager {
  constructor(io, userSocketMap) {
    this.io = io;
    this.userSocketMap = userSocketMap;
  }

  handleWaitingUpdate() {
    const waitingUsers = Array.from(this.userSocketMap.entries())
      .filter(([_, info]) => info.status === USER_STATUS.WAITING)
      .map(([userName]) => userName);
    console.log(
      "🚀 ~ RoomManager ~ handleWaitingUpdate ~ waitingUsers:",
      waitingUsers.length
    );

    this.io.to(ROOM_NAMES.WAITING).emit("userUpdate", waitingUsers);
  }

  handleRoomUpdate() {
    const rooms = this.io.sockets.adapter.rooms;
    const roomList = this.getRoomList(rooms);
    console.log("🚀 ~ RoomManager ~ handleRoomUpdate ~ roomList:", roomList);
    this.io.to(ROOM_NAMES.ADMIN).emit("roomUpdate", roomList);
  }

  getRoomList(rooms) {
    const roomList = [];

    rooms.forEach((value, key) => {
      // Socket ID가 아닌 실제 room만 필터링
      if (!value.has(key)) {
        // room의 소켓 ID들을 배열로 변환
        const socketIds = Array.from(value);

        // 각 소켓 ID에 해당하는 userName 찾기
        const clients = socketIds.map((socketId) => {
          // userSocketMap에서 해당 socketId를 가진 유저 찾기
          const user = Array.from(this.userSocketMap.entries()).find(
            ([_, info]) => info.socketId === socketId
          );

          return user
            ? {
                socketId,
                userName: user[0],
                status: user[1].status,
              }
            : { socketId };
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
