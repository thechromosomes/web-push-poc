// ⚠️ DEV ONLY — remove before production
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}
const express = require('express');
const webpush = require('web-push');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── VAPID Keys (generate once with: node generate-keys.js) ───────────────────
// In production, store these in environment variables!
const VAPID_KEYS = {
  publicKey:  'BP1meHA5-d-zYp8dJ4xMtfMr2cISpIIWpmxH5wdxkPmv1bVshyvi7wXsiSt1mXAnzfLymNYQUlQQiWsJ-emfL_Q',
  privateKey: 'qFczlk1x8vBcRkGOF_sNBzmqS_elwjPnSDAIj3d8CBY'
};

webpush.setVapidDetails(
  'mailto:demo@example.com',
  VAPID_KEYS.publicKey,
  VAPID_KEYS.privateKey
);

// ─── In-memory subscription store (use a DB in production) ───────────────────
const subscriptions = new Map();

// ─── Routes ───────────────────────────────────────────────────────────────────

// Serve VAPID public key to the client
app.get('/api/vapid-public-key', (req, res) => {
  res.json({ publicKey: VAPID_KEYS.publicKey });
});

// Subscribe: save a PushSubscription
app.post('/api/subscribe', (req, res) => {
  const subscription = req.body;

  if (!subscription?.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription object' });
  }

  const id = subscription.endpoint; // use endpoint as unique key
  subscriptions.set(id, subscription);

  console.log(`✅ New subscription saved. Total: ${subscriptions.size}`);
  res.status(201).json({ message: 'Subscribed successfully', id });
});

// Unsubscribe
app.post('/api/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  if (subscriptions.delete(endpoint)) {
    console.log(`❌ Subscription removed. Total: ${subscriptions.size}`);
    res.json({ message: 'Unsubscribed successfully' });
  } else {
    res.status(404).json({ error: 'Subscription not found' });
  }
});

// Send a push notification to ALL subscribers
app.post('/api/send-notification', async (req, res) => {
  const {
    title   = '🔔 Web Push POC',
    body    = 'Hello from the server!',
    icon    = '/icon.png',
    badge   = '/badge.png',
    url     = '/',
    tag     = 'default'
  } = req.body;

  if (subscriptions.size === 0) {
    return res.status(400).json({ error: 'No subscribers yet. Subscribe first!' });
  }

  const payload = JSON.stringify({ title, body, icon, badge, url, tag });
  const results = { sent: 0, failed: 0, errors: [] };

  const sends = [...subscriptions.values()].map(async (sub) => {
    try {
      await webpush.sendNotification(sub, payload);
      results.sent++;
    } catch (err) {
      console.error(`❌ Failed to send notification:`, err.message);
      results.failed++;
      results.errors.push(err.message);
      // Clean up expired/invalid subscriptions
      if (err.statusCode === 410 || err.statusCode === 404) {
        subscriptions.delete(sub.endpoint);
        console.log(`🗑  Removed stale subscription`);
      }
    }
  });

  await Promise.all(sends);
  console.log(`📤 Sent: ${results.sent}, Failed: ${results.failed}`);
  res.json({ ...results, totalSubscribers: subscriptions.size });
});

// List active subscribers count
app.get('/api/subscribers', (req, res) => {
  res.json({ count: subscriptions.size });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Web Push POC running at http://localhost:${PORT}`);
  console.log(`   VAPID Public Key: ${VAPID_KEYS.publicKey.slice(0, 30)}…\n`);
});
