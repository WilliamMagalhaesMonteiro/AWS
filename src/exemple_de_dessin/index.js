const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const port = 3000;

app.use(express.static(__dirname + '/public'));

var stack = [];

// Nouvelle connexion.
io.on("connection", function(socket) {

    // Envoi de toute le pile d'éxécution pour que le nouveau client récupère l'état du dessin.
    socket.emit("stoc stack", stack);

    // Transmission du dessin en temps réel :
    // Nouveau cercle
    socket.on("ctos draw cercle", function(props){
        // nouvelle forme envoyée à tous les autres clients
        socket.broadcast.emit("stoc draw cercle", props);
        stack.push({type: 'newCircle', props: props});
    });

    // Nouvelle ligne
    socket.on("ctos draw line", function(props) {
        socket.broadcast.emit("stoc draw line", props);
        stack.push({type: 'newLine', props: props});
    });

    // Fin du ligne, mise en cache.
    socket.on("ctos cache line", function() {
        socket.broadcast.emit("stoc cache line");
        stack.push({type: 'cacheLine'});
    });

    // Nouveau point d'une ligne.
    socket.on("ctos draw point", function(props) {
        socket.broadcast.emit("stoc draw point", props);
        stack.push({type: 'newPoint', props: props});
    });

    socket.on("ctos draw fill", function(props) {
        socket.broadcast.emit("stoc draw fill", props);
        stack.push({type: 'newFill', props: props});
    });

    // Suppression (poubelle).
    socket.on("ctos delete", function() {
        socket.broadcast.emit("stoc delete");
        stack.splice(0, stack.length);
    });

    // undo
    socket.on("ctos undo", function() {
        socket.broadcast.emit("stoc undo");
        stack.push({type: 'undo'});
    });

    // redo
    socket.on("ctos redo", function() {
        socket.broadcast.emit("stoc redo");
        stack.push({type: 'redo'});
    });
});

server.listen(port, () => {
    console.log('listening on port: %d', port);
});