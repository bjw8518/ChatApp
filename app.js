const mysql = require('mysql');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const dbConnection = mysql.createConnection({
  host: 'localhost',
  user: 'bjw',
  password: '0000',
  database: 'chatapp',
});

dbConnection.connect((err) => {
  if (err) {
    console.error('MariaDB 연결 오류: ', err);
    throw err;
  }
  console.log('MariaDB 연결 성공');
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const users = {};

io.on('connection', (socket) => {
  console.log('새로운 사용자가 연결됨');

  socket.on('join', (nick) => {
    users[socket.id] = nick;
    socket.broadcast.emit('user joined', nick);
    io.emit('updateUserList', users);
  });

  socket.on('chat message', (msg) => {
    const nick = users[socket.id];
    io.emit('chat message', { nick, message: msg });


    const insertQuery = 'INSERT INTO messages (nickname, content) VALUES (?, ?)';
    dbConnection.query(insertQuery, [nick, msg], (err, results) => {
      if (err) {
        console.error('저장 오류: ', err);
      }
    });
  });

  
  socket.on('disconnect', () => {
    const nick = users[socket.id];
    if (nick) {
      delete users[socket.id];
      socket.broadcast.emit('user left', nick);
      io.emit('updateUserList', users);
    }
    console.log('사용자가 연결을 끊음');
  });
});


server.listen(3000, () => {
});
