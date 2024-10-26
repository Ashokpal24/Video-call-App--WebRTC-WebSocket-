const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

const socket = new WebSocket.Server({
  port: 8080,
});
const peers = new Map();

socket.on("connection", (ws) => {
  const peerID = uuidv4();

  peers.set(peerID, ws);
  ws.send(JSON.stringify({ type: "id", peerID }));

  console.log("Connected ID: ", peerID);

  ws.on("message", (data) => {
    const parseData = JSON.parse(data);
    console.log(parseData);
    peers.forEach((value, key) => {
      if (value != ws && value.readyState === WebSocket.OPEN)
        value.send(JSON.stringify(parseData));
    });
  });

  ws.on("close", () => {
    peers.forEach((value, key) => {
      if (ws === value) {
        peers.delete(key);
        console.log("Disconnected ID: ", key);
      }
    });
  });
});

console.log(
  "websocket running : ws://squalid-spooky-superstition-qgpxggv499p2wg9-8080.app.github.dev"
);
