import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

interface User {
  id: string;
  socketId: string;
}

const users: User[] = [];

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('register', (userId: string) => {
    users.push({ id: userId, socketId: socket.id });
    console.log(`User registered: ${userId}`);
  });

  socket.on('disconnect', () => {
    const index = users.findIndex((user) => user.socketId === socket.id);
    if (index !== -1) {
      console.log(`User disconnected: ${users[index].id}`);
      users.splice(index, 1);
    }
  });

  socket.on('call-random', () => {
    if (users.length < 2) {
      socket.emit('error', 'Not enough users for a call');
      return;
    }

    const caller = users.find((user) => user.socketId === socket.id);
    if (!caller) {
      socket.emit('error', 'Caller not found');
      return;
    }

    const callee = users[Math.floor(Math.random() * users.length)];
    if (callee.socketId === socket.id) {
      socket.emit('error', 'No other users available for a call');
      return;
    }

    socket.emit('call-user', callee.id);
    io.to(callee.socketId).emit('incoming-call', caller.id);
  });

  socket.on('offer', (offer: RTCSessionDescriptionInit) => {
    socket.broadcast.emit('offer', offer);
  });

  socket.on('answer', (answer: RTCSessionDescriptionInit) => {
    socket.broadcast.emit('answer', answer);
  });

  socket.on('ice-candidate', (candidate: RTCIceCandidate) => {
    socket.broadcast.emit('ice-candidate', candidate);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
