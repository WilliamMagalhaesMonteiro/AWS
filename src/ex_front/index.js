const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const port = 3000;

app.use(express.static(__dirname + '/public'));

var stack = [];
var effSize = 0;
let lastLine;

function clearPrev() {
    if (effSize < stack.length) {
        let toDelete = stack.length - effSize;
        stack.splice(-toDelete, toDelete);
    }
}

// Nouvelle connexion.
io.on("connection", function(socket) {

    // Envoi de toute le pile d'éxécution pour que le nouveau client récupère l'état du dessin.
    socket.emit("stoc stack", {pile: stack, lg: effSize});

    // Transmission du dessin en temps réel :
    // Nouveau cercle
    socket.on("ctos draw cercle", function(props){
        // nouvelle forme envoyée à tous les autres clients
        socket.broadcast.emit("stoc draw cercle", props);
        clearPrev();
        stack.push({type: 'newCircle', props: props});
        effSize = stack.length;
    });

    // Nouvelle ligne
    socket.on("ctos draw line", function(props) {
        socket.broadcast.emit("stoc draw line", props);
        clearPrev();
        stack.push({type: 'newLine', props: props});
        effSize = stack.length;
        lastLine = props;
    });

    // Fin du ligne, mise en cache.
    socket.on("ctos cache line", function() {
        socket.broadcast.emit("stoc cache line");
        // pas besoin d'ajouter cette information à la pile,
        // chaque nouvelle ligne est mise en cache lors d'une nouvelle connexion
    });

    // Nouveau point d'une ligne.
    socket.on("ctos draw point", function(props) {
        socket.broadcast.emit("stoc draw point", props);
        lastLine.points.push(props.coords);
    });

    socket.on("ctos draw fill", function(props) {
        socket.broadcast.emit("stoc draw fill", props);
        clearPrev();
        stack.push({type: 'newFill', props: props});
        effSize = stack.length;
    });

    // Suppression (poubelle).
    socket.on("ctos delete", function() {
        socket.broadcast.emit("stoc delete");
        stack.splice(0, stack.length);
    });

    // undo
    socket.on("ctos undo", function() {
        socket.broadcast.emit("stoc undo");
        if (effSize > 0)
            effSize--;
    });

    // redo
    socket.on("ctos redo", function() {
        socket.broadcast.emit("stoc redo");
        if (effSize < stack.length)
            effSize++;
    });
});

server.listen(port, () => {
    console.log("listening on port: " + port);
});