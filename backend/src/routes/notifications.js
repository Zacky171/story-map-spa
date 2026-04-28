const express = require('express');
const { getSubscriptions, saveSubscriptions } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/** POST /notifications/subscribe */
router.post('/subscribe', authMiddleware, (req, res) => {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys) {
    return res.status(400).json({ error: true, message: 'endpoint and keys required' });
  }
  const subs = getSubscriptions();
  const existing = subs.findIndex(s => s.endpoint === endpoint);
  const sub = { endpoint, keys, userId: req.user.userId, createdAt: new Date().toISOString() };
  if (existing >= 0) subs[existing] = sub;
  else subs.push(sub);
  saveSubscriptions(subs);
  res.json({ error: false, message: 'Subscribed successfully' });
});

/** DELETE /notifications/subscribe */
router.delete('/subscribe', authMiddleware, (req, res) => {
  const { endpoint } = req.body;
  const subs = getSubscriptions().filter(s => s.endpoint !== endpoint);
  saveSubscriptions(subs);
  res.json({ error: false, message: 'Unsubscribed' });
});

module.exports = router;
