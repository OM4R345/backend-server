const express = require("express");
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = createServer(app);
const io = new Server(server);

const port = 3000;
app.use(express.json());

app.get("/", (req, res, next) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

io.on("connection", (socket) => {
  socket.on("global_message", (msg) => {
    io.emit("global_message", msg);
  });
});

server.listen(port, () => {
  console.log(`Server listen on port ${port}`);
});
