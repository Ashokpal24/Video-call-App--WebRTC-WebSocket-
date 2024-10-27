let peerConnection;
let localStream;
let socket;
let roomId;
let isCaller = false;

const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const createBtn = document.getElementById("createBtn");
const joinBtn = document.getElementById("joinBtn");
const hangupBtn = document.getElementById("hangupBtn");
const roomInput = document.getElementById("roomInput");
const copyBtn = document.getElementById("copyBtn");
const errorMsg = document.getElementById("errorMsg");

async function setupPeerConnection() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localVideo.srcObject = localStream;
    peerConnection = new RTCPeerConnection(configuration);

    // add media track to send to peer
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    // if track is received from peer add to remoteVideo HTML component
    peerConnection.ontrack = (event) => {
      console.log("received track", event.streams);
      remoteVideo.srcObject = event.streams[0];
      showControls(true);
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("local ICE candidate", isCaller);
        socket.send(
          JSON.stringify({
            type: "ice-candidate",
            candidate: event.candidate,
            roomId: roomInput.value,
            isCaller,
          })
        );
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      if (peerConnection.iceConnectionState === "diconnected") {
        hangup();
      }
      if (peerConnection.iceConnectionState === "failed") {
        console.log("connection failed");
      }
    };
  } catch (error) {
    showError(error.message);
  }
}

async function handleSignalingMessage(message) {
  try {
    switch (message.type) {
      case "room-created":
        roomId = message.roomId;
        roomInput.value = roomId;
        copyBtn.style.display = "block";
        isCaller = true;
        break;

      case "user-joined":
        if (isCaller) {
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          socket.send(
            JSON.stringify({
              type: "offer",
              offer,
              roomId: roomId,
            })
          );
        }
        break;

      case "offer":
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(message.offer)
        );
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.send(
          JSON.stringify({
            type: "answer",
            answer,
            roomId: roomInput.value,
          })
        );
        break;

      case "answer":
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(message.answer)
        );

      case "ice-candidate":
        if (message.candidate) {
          await peerConnection.addIceCandidate(
            new RTCIceCandidate(message.candidate)
          );
        }
        break;

      case "peer-disconnected":
        showError("Other peer disconnected");
        hangup();
        break;
    }
  } catch (error) {
    showError(error.message);
  }
}

async function createRoom() {
  try {
    await setupPeerConnection();
    socket.send(JSON.stringify({ type: "create-room" }));
  } catch (error) {
    showError(error.message);
  }
}

async function joinRoom() {
  try {
    if (!roomInput.value) {
      showError("Please enter a room ID");
      return;
    }
    await setupPeerConnection();
    socket.send(
      JSON.stringify({
        type: "join-room",
        roomId: roomInput.value,
      })
    );
  } catch (error) {
    showError(error.message);
  }
}

function hangup() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
  }
  socket.close();
  localVideo.srcObject = null;
  remoteVideo.srcObject = null;
  showControls(false);
}

function showControls(inCall) {
  createBtn.style.display = inCall ? "none" : "block";
  joinBtn.style.display = inCall ? "none" : "block";
  hangupBtn.style.display = inCall ? "block" : "none";
  roomInput.disabled = inCall;
}

function showError(message) {
  errorMsg.textContent = message;
  setTimeout(() => {
    errorMsg.textContent = "";
  }, 5000);
}

function connectWebSocket() {
  socket = new WebSocket(
    "wss://squalid-spooky-superstition-qgpxggv499p2wg9-8080.app.github.dev"
  );
  socket.onmessage = async (event) => {
    const message = JSON.parse(event.data);
    handleSignalingMessage(message);
  };
  socket.onerror = (error) => {
    console.log(error);
    showError("WebSocket connection error");
  };
}

createBtn.addEventListener("click", createRoom);
joinBtn.addEventListener("click", joinRoom);
hangupBtn.addEventListener("click", hangup);
copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(roomInput.value);
});
connectWebSocket();
// -------chat app code-------
// const socket = new WebSocket(
//   "wss://squalid-spooky-superstition-qgpxggv499p2wg9-8080.app.github.dev"
// );

// let selfID = null;

// function updateMessageBox(data) {
//   const messagesDiv = document.getElementById("show-message");
//   const newMessage = document.createElement("p");
//   newMessage.textContent = `${data.peerID} | ${data.message}`;
//   messagesDiv.appendChild(newMessage);
// }

// socket.onopen = function () {
//   console.log("connected to websocket");
// };

// socket.onmessage = function (event) {
//   const data = JSON.parse(event.data);
//   console.log(data);
//   if (data.type == "id") {
//     selfID = data.peerID;
//     console.log("New id received: ", selfID);
//   } else {
//     updateMessageBox(data);
//   }
// };

// function sendMessage() {
//   const input = document.getElementById("msg-input");
//   const data = {
//     peerID: selfID,
//     message: input.value,
//   };
//   socket.send(JSON.stringify(data));
//   input.value = "";
//   updateMessageBox(data);
// }

// socket.onclose = function () {
//   console.log("Disconnected from WebSocket server");
// };
