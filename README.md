# 🔔 Web Push POC — `npm web-push`

A minimal, fully working **Web Push** proof-of-concept using:

- **[web-push](https://github.com/web-push-libs/web-push)** (Node.js server)
- **Service Worker** (browser background listener)
- **Push API** + **Notifications API** (browser)
- **Express** (HTTP server + REST API)

---

## 📁 Project Structure

```
web-push-poc/
├── server.js              # Express server + web-push logic
├── generate-keys.js       # Utility: generate fresh VAPID keys
├── package.json
└── public/
    ├── index.html         # Frontend UI (subscribe / send)
    └── service-worker.js  # SW: handles push events, shows notifications
```

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Generate fresh VAPID keys
node generate-keys.js
# Then paste them into server.js

# 3. Start the server
node server.js

# 4. Open in browser
# http://localhost:3000
```

> **⚠️ HTTPS required in production.**  
> For local dev, `localhost` is treated as a secure origin by browsers, so no HTTPS setup is needed.

---

## 🔄 Flow Explained

```
Browser                          Server
  │                                │
  ├─ GET /api/vapid-public-key ──► │ ◄── VAPID key pair (set once)
  │ ◄── publicKey ─────────────────┤
  │                                │
  ├─ pushManager.subscribe() ──────┤ (browser ↔ push service)
  │ ◄── PushSubscription ──────────┤
  │                                │
  ├─ POST /api/subscribe ────────► │ saves subscription
  │                                │
  │                                │ POST /api/send-notification
  │                                ├─ webpush.sendNotification()
  │                                │      ↓ (push service)
  │ ◄── push event ────────────────┤
  │  [service-worker.js]           │
  └─ showNotification() ──────────►│ (shown to user)
```

---

## 🔌 API Endpoints

| Method | Path                      | Description                    |
|--------|---------------------------|--------------------------------|
| GET    | `/api/vapid-public-key`   | Returns VAPID public key       |
| POST   | `/api/subscribe`          | Save a PushSubscription        |
| POST   | `/api/unsubscribe`        | Remove a PushSubscription      |
| POST   | `/api/send-notification`  | Push to all subscribers        |
| GET    | `/api/subscribers`        | Count active subscribers       |

### POST `/api/send-notification` body (all optional)

```json
{
  "title": "Hello!",
  "body":  "Notification body text",
  "icon":  "/icon.png",
  "url":   "/",
  "tag":   "my-tag"
}
```

---

## 🔑 VAPID Keys

VAPID (Voluntary Application Server Identification) proves your server is the one sending the push.

```bash
node generate-keys.js
```

**In production** use environment variables:

```bash
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

---

## 🗄️ Production Checklist

- [ ] Replace in-memory `Map` with a real database (PostgreSQL, Redis, etc.)
- [ ] Store VAPID keys in environment variables (never commit them)
- [ ] Serve over **HTTPS**
- [ ] Handle `410 Gone` responses to auto-remove stale subscriptions (already done here)
- [ ] Add rate limiting to `/api/send-notification`
- [ ] Add authentication so only admins can send pushes
