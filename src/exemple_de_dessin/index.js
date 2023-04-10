const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static(__dirname + '/public'));

var stack = [];

// connexion
io.on("connection", function(socket) {

    socket.emit("stoc stack", stack);

    // quand un client envoie une nouvelle forme
    socket.on("ctos draw cercle", function(props){
        // nouvelle forme envoyée à tous les autres clients
        socket.broadcast.emit("stoc draw cercle", props);
        stack.push({type: 'newCircle', props: props});
    });

    socket.on("ctos draw line", function(props) {
        socket.broadcast.emit("stoc draw line", props);
        stack.push({type: 'newLine', props: props});
    });

    socket.on("ctos cache line", function() {
        socket.broadcast.emit("stoc cache line");
        stack.push({type: 'cacheLine'});
    });

    socket.on("ctos draw point", function(props) {
        socket.broadcast.emit("stoc draw point", props);
        stack.push({type: 'newPoint', props: props});
    });

    socket.on("ctos delete", function() {
        socket.broadcast.emit("stoc delete");
        stack.splice(0, stack.length);
    });

    socket.on("ctos undo", function() {
        socket.broadcast.emit("stoc undo");
        stack.push({type: 'undo'});
    });

    socket.on("ctos redo", function() {
        socket.broadcast.emit("stoc redo");
        stack.push({type: 'redo'});
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});