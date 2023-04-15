const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const port = 3000;

app.use(express.static(__dirname + '/public'));

var draw_stack = [];
var effSize = 0;
let lastLine;

var chat_stack = [];

function clearPrev() {
    if (effSize < draw_stack.length) {
        let toDelete = draw_stack.length - effSize;
        draw_stack.splice(-toDelete, toDelete);
    }
}

// Nouvelle connexion.
io.on("connection", function(socket) {

    // Envoi de toute le pile d'éxécution pour que le nouveau client récupère l'état du dessin.
    socket.emit("stoc draw stack", {pile: draw_stack, lg: effSize});
    socket.emit("stoc chat stack", chat_stack);

    // Transmission du dessin en temps réel :
    // Nouveau cercle
    socket.on("ctos draw cercle", function(props){
        // nouvelle forme envoyée à tous les autres clients
        socket.broadcast.emit("stoc draw cercle", props);
        clearPrev();
        draw_stack.push({type: 'newCircle', props: props});
        effSize = draw_stack.length;
    });

    // Nouvelle ligne
    socket.on("ctos draw line", function(props) {
        socket.broadcast.emit("stoc draw line", props);
        clearPrev();
        draw_stack.push({type: 'newLine', props: props});
        effSize = draw_stack.length;
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
        if (lastLine) {
            lastLine.points.push(props.coords);
        }
    });

    socket.on("ctos draw fill", function(props) {
        socket.broadcast.emit("stoc draw fill", props);
        clearPrev();
        draw_stack.push({type: 'newFill', props: props});
        effSize = draw_stack.length;
    });

    // Suppression (poubelle).
    socket.on("ctos delete", function() {
        socket.broadcast.emit("stoc delete");
        draw_stack.splice(0, draw_stack.length);
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
        if (effSize < draw_stack.length)
            effSize++;
    });

    // Message dans le chat !
    socket.on('chat message', (msg) => {
        socket.broadcast.emit('chat message', msg);
        chat_stack.push(msg);
    });
});

server.listen(port, () => {
    console.log("listening on port: " + port);
});