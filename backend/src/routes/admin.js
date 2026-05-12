const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// All admin routes require admin token
router.use(adminMiddleware);

/** GET /admin/users - list all users */
router.get('/users', async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, is_admin, created_at FROM users ORDER BY created_at DESC');
    
    const users = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      isAdmin: row.is_admin,
      createdAt: row.created_at
    }));

    res.json({ error: false, users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
});

/** GET /admin/users/:id */
router.get('/users/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, is_admin, created_at FROM users WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }

    const row = result.rows[0];
    const user = {
      id: row.id,
      name: row.name,
      email: row.email,
      isAdmin: row.is_admin,
      createdAt: row.created_at
    };

    res.json({ error: false, user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
});

/** POST /admin/users - create user */
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, isAdmin } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: true, message: 'name, email, password required' });
    }

    // Check if email exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: true, message: 'Email sudah terdaftar' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const result = await db.query(
      'INSERT INTO users (id, name, email, password, is_admin, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, is_admin, created_at',
      [userId, name, email, hashed, !!isAdmin, new Date().toISOString()]
    );

    const row = result.rows[0];
    const user = {
      id: row.id,
      name: row.name,
      email: row.email,
      isAdmin: row.is_admin,
      createdAt: row.created_at
    };

    res.status(201).json({ error: false, message: 'User created', user });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
});

/** PUT /admin/users/:id - update user */
router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, password, isAdmin } = req.body;
    
    const existing = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }

    const user = existing.rows[0];
    const updatedName = name || user.name;
    const updatedEmail = email || user.email;
    const updatedPassword = password ? await bcrypt.hash(password, 10) : user.password;
    const updatedIsAdmin = isAdmin !== undefined ? !!isAdmin : user.is_admin;

    const result = await db.query(
      'UPDATE users SET name = $1, email = $2, password = $3, is_admin = $4 WHERE id = $5 RETURNING id, name, email, is_admin, created_at',
      [updatedName, updatedEmail, updatedPassword, updatedIsAdmin, req.params.id]
    );

    const row = result.rows[0];
    const updatedUser = {
      id: row.id,
      name: row.name,
      email: row.email,
      isAdmin: row.is_admin,
      createdAt: row.created_at
    };

    res.json({ error: false, message: 'User updated', user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
});

/** DELETE /admin/users/:id */
router.delete('/users/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }

    res.json({ error: false, message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
});

/** GET /admin/stories - all stories */
router.get('/stories', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM stories ORDER BY created_at DESC');
    
    const stories = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      userId: row.user_id,
      description: row.description,
      photoUrl: row.photo_url,
      lat: row.lat,
      lon: row.lon,
      createdAt: row.created_at
    }));

    res.json({ error: false, stories });
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
});

/** DELETE /admin/stories/:id */
router.delete('/stories/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM stories WHERE id = $1 RETURNING id', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Story not found' });
    }

    res.json({ error: false, message: 'Story deleted' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
});

/** GET /admin/stats */
router.get('/stats', async (req, res) => {
  try {
    const userCount = await db.query('SELECT COUNT(*) FROM users');
    const storyCount = await db.query('SELECT COUNT(*) FROM stories');
    const adminCount = await db.query('SELECT COUNT(*) FROM users WHERE is_admin = true');
    const locationCount = await db.query('SELECT COUNT(*) FROM stories WHERE lat IS NOT NULL AND lon IS NOT NULL');

    res.json({
      error: false,
      stats: {
        totalUsers: parseInt(userCount.rows[0].count),
        totalStories: parseInt(storyCount.rows[0].count),
        totalAdmins: parseInt(adminCount.rows[0].count),
        storiesWithLocation: parseInt(locationCount.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
});

module.exports = router;
