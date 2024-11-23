const express = require("express");
const http = require("http");
const app = express();
const PORT = 5000;
const server = http.createServer(app);
app.use(express.static("basic_app"));
server.listen(PORT, () => console.log("client started"));
