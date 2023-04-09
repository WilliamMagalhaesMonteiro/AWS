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
    socket.on("ctos draw cercle", function(props){

        // nouvelle forme envoyée à tous les autres clients
        socket.broadcast.emit("stoc draw cercle", props);
    });

    socket.on("ctos draw line", function(props) {
        socket.broadcast.emit("stoc draw line", props);
    });

    socket.on("ctos draw point", function(props) {
        socket.broadcast.emit("stoc draw point", props);
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});