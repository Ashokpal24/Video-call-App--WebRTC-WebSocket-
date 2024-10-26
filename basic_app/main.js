const socket = new WebSocket(
  "wss://squalid-spooky-superstition-qgpxggv499p2wg9-8080.app.github.dev"
);

let selfID = null;

function updateMessageBox(data) {
  const messagesDiv = document.getElementById("show-message");
  const newMessage = document.createElement("p");
  newMessage.textContent = `${data.peerID} | ${data.message}`;
  messagesDiv.appendChild(newMessage);
}

socket.onopen = function () {
  console.log("connected to websocket");
};

socket.onmessage = function (event) {
  const data = JSON.parse(event.data);
  console.log(data);
  if (data.type == "id") {
    selfID = data.peerID;
    console.log("New id received: ", selfID);
  } else {
    updateMessageBox(data);
  }
};

function sendMessage() {
  const input = document.getElementById("msg-input");
  const data = {
    peerID: selfID,
    message: input.value,
  };
  socket.send(JSON.stringify(data));
  input.value = "";
  updateMessageBox(data);
}

socket.onclose = function () {
  console.log("Disconnected from WebSocket server");
};
