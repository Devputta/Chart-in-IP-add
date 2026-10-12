import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const app = express();
const server = http.createServer(app);

// Security middleware - remove server fingerprints and prevent framing/sniffing/XSS
app.disable('x-powered-by');

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://raw.githubusercontent.com https://github.com; media-src 'self' data: blob:; connect-src 'self' ws: wss:; frame-src 'self' blob: data:; object-src 'none';"
  );
  next();
});

app.use(express.json({ limit: '100kb' }));

interface ClientState {
  id: string;
  room: string | null;
  name: string;
  ws: WebSocket;
  ip: string;
  msgCount: number;
  lastReset: number;
}

const clients = new Map<WebSocket, ClientState>();
const rooms = new Map<string, Set<WebSocket>>();
const ipConnections = new Map<string, number>();

// Hacker defense thresholds: rate limiting & concurrency caps
const MAX_CONNECTIONS_PER_IP = 25;
const MAX_MESSAGES_PER_SEC = 40;

function safeSend(ws: WebSocket, payload: object) {
  if (ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify(payload));
    } catch (err) {
      console.error('Error sending WS message:', err);
    }
  }
}

// WebSocket server mounted explicitly on /ws
const wss = new WebSocketServer({
  server,
  path: '/ws',
  maxPayload: 30 * 1024 * 1024, // 30MB payload limit for in-flight encrypted media
});

// Periodic heartbeat to terminate zombie connections
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws: any) => {
    if (ws.isAlive === false) {
      return ws.terminate();
    }
    ws.isAlive = false;
    try {
      ws.ping();
    } catch {
      ws.terminate();
    }
  });
}, 30000);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

wss.on('connection', (ws: any, req) => {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
  const currentIpCount = ipConnections.get(ip) || 0;

  if (currentIpCount >= MAX_CONNECTIONS_PER_IP) {
    safeSend(ws, { type: 'error', message: 'Too many concurrent connections from this IP.' });
    ws.close(1008, 'Rate limited');
    return;
  }
  ipConnections.set(ip, currentIpCount + 1);

  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  const clientId = Math.random().toString(36).substring(2, 9);
  const state: ClientState = {
    id: clientId,
    room: null,
    name: 'Peer',
    ws,
    ip,
    msgCount: 0,
    lastReset: Date.now(),
  };
  clients.set(ws, state);

  // Send initial ready signal
  safeSend(ws, { type: 'ready', clientId });

  ws.on('message', (raw: any) => {
    // Per-socket rate limiting to prevent flooding / DoS attacks
    const now = Date.now();
    if (now - state.lastReset > 1000) {
      state.msgCount = 1;
      state.lastReset = now;
    } else {
      state.msgCount += 1;
      if (state.msgCount > MAX_MESSAGES_PER_SEC) {
        return safeSend(ws, { type: 'error', message: 'Message rate limit exceeded. Please wait a second.' });
      }
    }

    let msg: any;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return safeSend(ws, { type: 'error', message: 'Malformed JSON payload.' });
    }

    if (!msg || typeof msg !== 'object') {
      return safeSend(ws, { type: 'error', message: 'Invalid payload structure.' });
    }

    if (msg.type === 'ping') {
      return safeSend(ws, { type: 'pong', timestamp: Date.now() });
    }

    if (msg.type === 'join') {
      const rawCode = String(msg.code || '').replace(/\D/g, '').slice(0, 6);
      if (!/^\d{3,6}$/.test(rawCode)) {
        return safeSend(ws, {
          type: 'error',
          message: 'PIN must be 3 to 6 numerical digits (e.g. 234).',
        });
      }

      // If already in this room, do not reject, just confirm
      if (state.room === rawCode && rooms.get(rawCode)?.has(ws)) {
        const currentRoom = rooms.get(rawCode)!;
        return safeSend(ws, {
          type: 'joined',
          code: rawCode,
          participants: currentRoom.size,
          peerPresent: currentRoom.size === 2,
        });
      }

      // Leave previous room if any
      if (state.room && rooms.has(state.room)) {
        const prevRoom = rooms.get(state.room)!;
        prevRoom.delete(ws);
        for (const peer of prevRoom) {
          safeSend(peer, { type: 'peer-left' });
        }
        if (prevRoom.size === 0) rooms.delete(state.room);
      }

      if (!rooms.has(rawCode)) {
        rooms.set(rawCode, new Set());
      }
      const room = rooms.get(rawCode)!;

      if (room.size >= 2) {
        return safeSend(ws, {
          type: 'error',
          message: `Channel #${rawCode} is already occupied by two people. Pick a different PIN.`,
        });
      }

      state.room = rawCode;
      // Strip control chars and HTML angle brackets for anti-XSS safety
      state.name = String(msg.name || 'Anonymous')
        .slice(0, 30)
        .replace(/[\x00-\x1F\x7F<>&"']/g, '');
      room.add(ws);

      // Confirm join to the client
      safeSend(ws, {
        type: 'joined',
        code: rawCode,
        participants: room.size,
        peerPresent: room.size === 2,
      });

      // Notify other participant
      for (const peer of room) {
        if (peer !== ws) {
          safeSend(peer, {
            type: 'peer-joined',
            peerName: state.name,
            participants: 2,
          });
          safeSend(ws, {
            type: 'peer-present',
            peerName: clients.get(peer)?.name || 'Peer',
          });
        }
      }
      return;
    }

    if (msg.type === 'leave') {
      if (state.room && rooms.has(state.room)) {
        const room = rooms.get(state.room)!;
        room.delete(ws);
        for (const peer of room) {
          safeSend(peer, { type: 'peer-left' });
        }
        if (room.size === 0) rooms.delete(state.room);
        state.room = null;
      }
      safeSend(ws, { type: 'left' });
      return;
    }

    // Blind forwarding of ciphertext
    if (msg.type === 'ciphertext' && state.room) {
      if (!msg.payload || typeof msg.payload !== 'object' || !msg.payload.iv || !msg.payload.data) {
        return safeSend(ws, { type: 'error', message: 'Invalid encrypted payload format.' });
      }

      const room = rooms.get(state.room);
      if (!room) return;
      for (const peer of room) {
        if (peer !== ws) {
          safeSend(peer, {
            type: 'ciphertext',
            payload: msg.payload,
            senderId: state.id,
            timestamp: Date.now(),
          });
        }
      }
      return;
    }

    // Typing presence
    if (msg.type === 'typing' && state.room) {
      const room = rooms.get(state.room);
      if (!room) return;
      for (const peer of room) {
        if (peer !== ws) {
          safeSend(peer, {
            type: 'peer-typing',
            isTyping: Boolean(msg.isTyping),
          });
        }
      }
      return;
    }

    // Message deletion sync between peers
    if (msg.type === 'delete-message' && state.room) {
      const messageId = String(msg.messageId || '').slice(0, 100);
      if (!messageId) return;

      const room = rooms.get(state.room);
      if (!room) return;
      for (const peer of room) {
        if (peer !== ws) {
          safeSend(peer, {
            type: 'message-deleted',
            messageId,
          });
        }
      }
      return;
    }
  });

  ws.on('close', () => {
    // Decrement IP connection count
    const count = ipConnections.get(state.ip) || 1;
    if (count <= 1) {
      ipConnections.delete(state.ip);
    } else {
      ipConnections.set(state.ip, count - 1);
    }

    if (state.room && rooms.has(state.room)) {
      const room = rooms.get(state.room)!;
      room.delete(ws);
      for (const peer of room) {
        safeSend(peer, { type: 'peer-left' });
      }
      if (room.size === 0) rooms.delete(state.room);
    }
    clients.delete(ws);
  });
});

// REST Health and Room Inspect endpoints
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    timestamp: Date.now(),
    activeRooms: rooms.size,
    totalConnections: clients.size,
  });
});

app.get('/api/room/:code', (req, res) => {
  const code = String(req.params.code).replace(/\D/g, '').slice(0, 6);
  const room = rooms.get(code);
  const count = room ? room.size : 0;
  res.json({
    code,
    occupancy: count,
    available: count < 2,
    isFull: count >= 2,
  });
});

async function startServer() {
  const publicPath = path.resolve(__dirname, 'public');
  app.use(express.static(publicPath));

  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`CipherLink relay server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
