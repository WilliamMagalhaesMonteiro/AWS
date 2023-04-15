const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const mysql = require('mysql');


app.use(express.static(__dirname + '/public'));



const db = mysql.createConnection({ host: "localhost", user: "le_patron", password: "motdepassebidon" });

db.connect(function (err) {
  if (err) {
    throw err;

  }
  else { console.log("Connecté à la base de données MySQL!"); }
});

db.query(
  "USE MOTS;",
  function (err, result) {
    if (err) throw err;
    console.log(result);
  }
);

db.query(
  "SELECT * FROM mots;",
  function (err, result) {
    if (err) throw err;
    console.log(result);
  }
);


io.on('connection', (socket) => {
  socket.on('chat message', (msg) => {
    //io.emit('chat message', msg);
    socket.broadcast.emit('chat message', msg);
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
