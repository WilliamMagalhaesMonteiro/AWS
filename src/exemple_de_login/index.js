const mysql = require('mysql');
const express = require('express');
const session = require('express-session');
const path = require('path');

const connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'admin',
	password : 'Supermotdepasse',
	database : 'loginBD'
});

connection.query(
    "select * from comptes;",
    function (err, result) {
      if (err) throw err;
      console.log(result);
    }
);

const app = express();

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname, 'index.html'));
});

// Lorsque l'utilisateur clique sur 'Login'
// -> http://localhost:3000/auth
app.post('/auth', function(request, response) {
	let username = request.body.username;
	let password = request.body.password;
	if (username && password) {
		// Vraiment la base de la base avec les failles qui vont avec
		connection.query('select * from comptes where username = ? and password = ?', [username, password], function(error, results, fields) {
			if (error) throw error;
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				return response.redirect('/pictionary');
			} else {
				response.send('Incorrect Username and/or Password!');
			}
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});

function pictionaryGetVerifAuth(request, response, next) {
    if (request.session.loggedin) {
		return next();
	} else {
		response.send('Please login to view this page!');
	}
	response.end();
}

app.use(express.static(path.join(__dirname, 'pictionary')));

app.get('/pictionary', pictionaryGetVerifAuth, function(request, response) {
    response.sendFile(path.join(__dirname, 'pictionary', 'index.html'));
});

const port_socket = 3000;

/* Socket et jeu */
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

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

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

server.listen(port_socket, () => {
	console.log("listening on port " + port_socket);
});
  