const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

const socket = new WebSocket.Server({
  port: 8080,
});

const rooms = new Map();

socket.on("connection", (ws) => {
  console.log("connected");
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case "create-room":
          const roomId = uuidv4();
          rooms.set(roomId, { caller: ws });
          ws.send(
            JSON.stringify({
              type: "room-created",
              roomId,
            })
          );
          console.log("caller ID generated: ", roomId);
          break;

        case "join-room":
          const room = rooms.get(data.roomId);
          if (room) {
            room.joiner = ws;
            room.caller.send(
              JSON.stringify({
                type: "user-joined",
              })
            );
            console.log("User Joined room", data.roomId);
          }
          break;

        case "offer":
          const roomWithOffer = rooms.get(data.roomId);
          if (roomWithOffer && roomWithOffer.joiner) {
            roomWithOffer.joiner.send(
              JSON.stringify({
                type: "offer",
                offer: data.offer,
              })
            );
          }
          console.log("Offer forwarded to joiner");
          break;

        case "answer":
          const roomWithAnswer = rooms.get(data.roomId);
          if (roomWithAnswer && roomWithAnswer.caller) {
            // console.log(data);
            roomWithAnswer.caller.send(
              JSON.stringify({
                type: "answer",
                answer: data.answer,
              })
            );
          }
          console.log("Answer forwarded to caller");
          break;

        case "ice-candidate":
          const roomWithCandidate = rooms.get(data.roomId);
          if (roomWithCandidate) {
            const targetWs = data.isCaller
              ? roomWithCandidate.joiner
              : roomWithCandidate.offer;

            if (targetWs) {
              targetWs.send(
                JSON.stringify({
                  type: "ice-candidate",
                  candidate: data.candidate,
                })
              );
            }
            console.log("ICE candidate forwarded caller:", data.isCaller);
          }
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });
  ws.on("close", () => {
    console.log("Client disconnected");
    rooms.forEach((room, key) => {
      if (room.caller === ws || room.joiner === ws) {
        const otherPeer = room.caller === ws ? room.joiner : room.caller;
        if (otherPeer) {
          otherPeer.send(JSON.stringify({ type: "peer-disconnected" }));
        }
        rooms.delete(key);
        console.log("Room removed:", key);
      }
    });
  });
});

console.log(
  "websocket running : wss://squalid-spooky-superstition-qgpxggv499p2wg9-8080.app.github.dev"
);

// -----basic chat app-----

// const peers = new Map();

// socket.on("connection", (ws) => {
//   const peerID = uuidv4();

//   peers.set(peerID, ws);
//   ws.send(JSON.stringify({ type: "id", peerID }));

//   console.log("Connected ID: ", peerID);

//   ws.on("message", (data) => {
//     const parseData = JSON.parse(data);
//     console.log(parseData);
//     peers.forEach((value, key) => {
//       if (value != ws && value.readyState === WebSocket.OPEN)
//         value.send(JSON.stringify(parseData));
//     });
//   });

//   ws.on("close", () => {
//     peers.forEach((value, key) => {
//       if (ws === value) {
//         peers.delete(key);
//         console.log("Disconnected ID: ", key);
//       }
//     });
//   });
// });
