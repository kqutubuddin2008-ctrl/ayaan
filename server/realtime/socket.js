import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';

const presence = new Map();
const activeCalls = new Map();

export function attachRealtimeServer(httpServer, { clientUrl }) {
  const io = new Server(httpServer, {
    cors: { origin: clientUrl, credentials: true },
    transports: ['websocket', 'polling'],
    pingTimeout: 20_000,
    maxHttpBufferSize: 25 * 1024 * 1024
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      socket.user = demoUser(socket);
      return next();
    }
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET || 'development-secret');
      return next();
    } catch (_error) {
      return next(new Error('Unauthorized realtime session'));
    }
  });

  io.on('connection', (socket) => {
    const user = normalizeUser(socket.user, socket.id);
    presence.set(user.id, { ...user, socketId: socket.id, status: 'online', lastSeen: new Date().toISOString() });
    socket.join(`user:${user.id}`);
    io.emit('presence:update', Array.from(presence.values()));

    socket.on('room:join', ({ roomId }) => {
      socket.join(roomId);
      socket.to(roomId).emit('room:member-joined', { roomId, user });
    });

    socket.on('room:leave', ({ roomId }) => socket.leave(roomId));

    socket.on('message:send', (payload, ack) => {
      const message = {
        id: payload.id || randomUUID(),
        roomId: payload.roomId,
        author: user,
        content: payload.content,
        attachments: payload.attachments || [],
        encrypted: Boolean(payload.encrypted),
        reactions: [],
        status: 'delivered',
        createdAt: new Date().toISOString(),
        replyTo: payload.replyTo || null
      };
      io.to(payload.roomId).emit('message:new', message);
      ack?.({ ok: true, message });
    });

    socket.on('message:typing', ({ roomId, isTyping }) => {
      socket.to(roomId).emit('message:typing', { roomId, user, isTyping });
    });

    socket.on('message:reaction', ({ roomId, messageId, emoji }) => {
      io.to(roomId).emit('message:reaction', { roomId, messageId, emoji, userId: user.id });
    });

    socket.on('message:read', ({ roomId, messageId }) => {
      socket.to(roomId).emit('message:read', { roomId, messageId, userId: user.id, readAt: new Date().toISOString() });
    });

    socket.on('call:invite', ({ roomId, callId, participants, mode }) => {
      const call = { callId, roomId, host: user, participants, mode, startedAt: new Date().toISOString(), quality: 'HD' };
      activeCalls.set(callId, call);
      io.to(roomId).emit('call:incoming', call);
    });

    socket.on('call:join', ({ roomId, callId }) => {
      socket.join(`call:${callId}`);
      io.to(roomId).emit('call:participant-joined', { callId, user });
    });

    socket.on('webrtc:offer', ({ callId, targetUserId, offer }) => io.to(`user:${targetUserId}`).emit('webrtc:offer', { callId, from: user, offer }));
    socket.on('webrtc:answer', ({ callId, targetUserId, answer }) => io.to(`user:${targetUserId}`).emit('webrtc:answer', { callId, from: user, answer }));
    socket.on('webrtc:ice-candidate', ({ callId, targetUserId, candidate }) => io.to(`user:${targetUserId}`).emit('webrtc:ice-candidate', { callId, from: user, candidate }));
    socket.on('call:media-state', ({ callId, state }) => io.to(`call:${callId}`).emit('call:media-state', { callId, userId: user.id, state }));
    socket.on('call:end', ({ roomId, callId }) => {
      activeCalls.delete(callId);
      io.to(roomId).emit('call:ended', { callId, endedBy: user.id, endedAt: new Date().toISOString() });
    });

    socket.on('disconnect', () => {
      presence.set(user.id, { ...user, status: 'offline', lastSeen: new Date().toISOString() });
      io.emit('presence:update', Array.from(presence.values()));
    });
  });

  return io;
}

function demoUser(socket) {
  return { id: `guest-${socket.id.slice(0, 6)}`, name: 'Guest Operator', email: 'guest@nexus.local', role: 'user' };
}

function normalizeUser(user, socketId) {
  return { id: user.id || user._id || `guest-${socketId.slice(0, 6)}`, name: user.name || user.email || 'Nexus User', email: user.email, role: user.role || 'user' };
}
