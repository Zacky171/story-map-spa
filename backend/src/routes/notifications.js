const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/** POST /notifications/subscribe */
router.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    
    if (!endpoint || !keys) {
      return res.status(400).json({ error: true, message: 'endpoint and keys required' });
    }

    // Check if subscription already exists
    const existing = await db.query('SELECT id FROM subscriptions WHERE endpoint = $1', [endpoint]);

    if (existing.rows.length > 0) {
      // Update existing subscription
      await db.query(
        'UPDATE subscriptions SET user_id = $1, keys = $2, created_at = $3 WHERE endpoint = $4',
        [req.user.userId, JSON.stringify(keys), new Date().toISOString(), endpoint]
      );
    } else {
      // Insert new subscription
      await db.query(
        'INSERT INTO subscriptions (user_id, endpoint, keys, created_at) VALUES ($1, $2, $3, $4)',
        [req.user.userId, endpoint, JSON.stringify(keys), new Date().toISOString()]
      );
    }

    res.json({ error: false, message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
});

/** DELETE /notifications/subscribe */
router.delete('/subscribe', authMiddleware, async (req, res) => {
  try {
    const { endpoint } = req.body;
    
    await db.query('DELETE FROM subscriptions WHERE endpoint = $1', [endpoint]);

    res.json({ error: false, message: 'Unsubscribed' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
});

module.exports = router;
