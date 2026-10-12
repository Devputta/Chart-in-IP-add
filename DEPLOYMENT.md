# CipherLink Deployment Guide: Render vs. Vercel

This guide explains compatibility, security architecture, and step-by-step instructions for deploying CipherLink to **Render** and **Vercel**.

---

## ⚡ Quick Summary: Which Platform Should You Use?

| Platform | Compatible? | Support for Persistent WebSockets? | Recommendation |
|---|---|---|---|
| **Render** | ✅ **100% Fully Compatible** | ✅ **Yes** (Native long-lived TCP/WebSocket connections) | **Recommended**: Deploys both the Vite frontend and the Node.js encrypted WebSocket relay in one service. |
| **Vercel** | ⚠️ **Frontend Only** | ❌ **No** (Vercel Serverless Functions terminate after seconds; cannot maintain persistent Node `ws` servers) | **Not recommended for all-in-one**: Can host the static UI, but the WebSocket server must run elsewhere (e.g. Render). |

---

## 🚀 Deploying to Render (Recommended — 100% Free Tier Ready)

Render provides persistent containerized Node.js Web Services that keep WebSocket connections alive 24/7 with automatic HTTPS and WSS (secure WebSockets).

### Option 1: Automatic Blueprint (One-Click)
Because this repository includes `render.yaml`, Render can configure the entire service automatically:
1. Push your repository to GitHub or GitLab.
2. Go to [dashboard.render.com](https://dashboard.render.com) and click **New > Blueprint**.
3. Connect your repository. Render will automatically detect `render.yaml` and provision your service.

### Option 2: Manual Setup on Render
1. Go to [dashboard.render.com](https://dashboard.render.com) and click **New > Web Service**.
2. Connect your repository: `https://github.com/Devputta/CipherLink-.git`
3. Fill in the service configuration:
   - **Name**: `cipherlink`
   - **Runtime**: `Node`
   - **Region**: Choose the closest region (e.g., Oregon, Frankfurt, Singapore)
   - **Branch**: `main`
   - **Build Command**:
     ```bash
     npm install && npm run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Plan**: `Free`
4. Add Environment Variables (under Advanced):
   - `NODE_ENV`: `production`
5. Click **Create Web Service**.
6. Render will run the Vite build, start `server.ts`, and provide you with an HTTPS / WSS URL (e.g., `https://cipherlink.onrender.com`).

---

## ⚠️ Deploying to Vercel (What You Need to Know)

### Why doesn't the full-stack server run on Vercel directly?
Vercel is designed for **Serverless Functions** (stateless event-driven HTTP handlers). Vercel functions:
- Spin down after responding to an HTTP request (10–60 second maximum execution limits).
- Do **not** allow persistent, stateful WebSocket listener processes (`new WebSocketServer(...)`).
- Reject open bidirectional TCP sockets required for real-time peer message exchange.

### How you CAN use Vercel (Split Architecture):
If you specifically want Vercel for the frontend:
1. **Deploy Frontend on Vercel**: Run `npm run build` with output directory `dist`.
2. **Deploy WebSocket Relay on Render / Fly.io / Railway**: Run `server.ts` as a persistent process.
3. Configure the frontend's WebSocket URL to point to your Render backend (e.g. `wss://cipherlink-relay.onrender.com/ws`).

> **Verdict**: Using **Render** is much simpler and eliminates the need for two separate hosting providers!

---

## 🔒 Production Security Checklist

CipherLink is already pre-configured with top-tier security standards:

1. **Client-Side Cryptography**:
   - AES-256-GCM authenticated encryption via the standard W3C Web Cryptography API (`crypto.subtle`).
   - PBKDF2-HMAC-SHA-256 key derivation with 120,000 iterations.
   - Per-message 96-bit cryptographically random IVs generated via `crypto.getRandomValues`.

2. **Zero-Knowledge Relay Server**:
   - The relay server never sees plaintext messages, passkeys, or unencrypted media.
   - Channels are strictly capped at 2 participants; unauthorized third parties are rejected.

3. **Server-Side Hardening (`server.ts`)**:
   - Automatic Content Security Policy (CSP), `X-Content-Type-Options: nosniff`, and `X-Frame-Options: SAMEORIGIN`.
   - Rate limiting: max 40 messages/second per client and connection limits per IP to protect against DoS attacks.
   - Heartbeat ping/pong health monitor running every 30 seconds to terminate dead TCP sockets.
   - Ephemeral in-memory state: zero disk writes, zero database logging, and instant purge when channels close.
