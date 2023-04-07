const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);


app.use(express.static(__dirname + '/public'));

// connexion
io.on("connection", function(socket) {


    // quand un client envoie une nouvelle forme
    socket.on("client draw new", function(drawable){

        // nouvelle forme envoyée à tous les autres clients
        socket.broadcast.emit("serv draw new", drawable);
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});