# WebRTC Signaling + 채팅용 Socekt Server

## 프로젝트 소개

이 프로젝트는 WebRTC 기술을 활용한 실시간 P2P 화상 채팅 서비스의 시그널링과 채팅을 위한 Socket 통신 서버입니다.

## 주요 기능

- WebRTC 시그널링 (P2P 연결 중계)
- 실시간 채팅
- 관리자 모니터링

## 시스템 구조

```javascript
src/
├── handlers/
│ ├── inoutHandler.js // 입퇴장 처리
│ └── signalingHandler.js // WebRTC 시그널링 처리
├── services/
│ └── roomManager.js // 유저, Room 상태 관리
└── utils/
└── constants.js // 상수 정의
```

## 환경 설정

서버는 기본적으로 3000 포트에서 실행되며, 환경 변수를 통해 포트 변경이 가능합니다.

### CORS 설정

현재 허용된 도메인:

- https://rtc-admin.vercel.app
- http://localhost:5173

## 소켓 이벤트 목록

### App 클라이언트 -> 서버

- `waiting`: 대기실 입장
- `offer`: WebRTC offer 전송
- `answer`: WebRTC answer 전송
- `ice`: ICE candidate 전송
- `chat`: 채팅 메시지 전송
- `callEnd`: 통화 종료

### Admin 클라이언트 -> 서버

- `admin`: 관리자 접속
- `adminMessage`: 관리자 메시지 전송

### 서버 -> Admin 클라이언트

- `roomUpdate`: 방 목록 업데이트

### 서버 -> 클라이언트

- `userUpdate`: 대기 유저 목록 업데이트
- `offer`: WebRTC offer 수신
- `answer`: WebRTC answer 수신
- `ice`: ICE candidate 수신
- `chat`: 채팅 메시지 수신
- `callFailed`: 통화 연결 실패
