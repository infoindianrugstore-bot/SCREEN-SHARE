const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, { cors: { origin: "*" } });

app.use(express.static("public"));

io.on("connection", socket => {
    console.log("User connected:", socket.id);

    socket.on("offer", data => {
        socket.broadcast.emit("offer", data);
    });

    socket.on("answer", data => {
        socket.broadcast.emit("answer", data);
    });

    socket.on("ice", data => {
        socket.broadcast.emit("ice", data);
    });
});

http.listen(3000, () => console.log("Server running on port 3000"));
