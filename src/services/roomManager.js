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

        // socketId에 해당하는 userName만 추출하여 배열로 만들기
        const clients = socketIds.map((socketId) => {
          // userSocketMap에서 해당 socketId를 가진 유저 찾기
          const user = Array.from(this.userSocketMap.entries()).find(
            ([_, info]) => info.socketId === socketId
          );

          // userName만 반환, 없으면 socketId 반환
          return user ? user[0] : socketId;
        });

        roomList.push({
          room: key,
          numberOfClients: value.size,
          clients, // 이제 string[] 타입이 됨
        });
      }
    });
    return roomList;
  }
}
