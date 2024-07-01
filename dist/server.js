"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: 'https://powtfy.vercel.app/',
        methods: ['GET', 'POST']
    }
});
const users = [];
io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);
    socket.on('register', (userId) => {
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
    socket.on('offer', (offer) => {
        socket.broadcast.emit('offer', offer);
    });
    socket.on('answer', (answer) => {
        socket.broadcast.emit('answer', answer);
    });
    socket.on('ice-candidate', (candidate) => {
        socket.broadcast.emit('ice-candidate', candidate);
    });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
