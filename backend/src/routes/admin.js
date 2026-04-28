const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getUsers, saveUsers, getStories, saveStories } = require('../db');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// All admin routes require admin token
router.use(adminMiddleware);

/** GET /admin/users - list all users */
router.get('/users', (req, res) => {
  const users = getUsers().map(({ password, ...u }) => u);
  res.json({ error: false, users });
});

/** GET /admin/users/:id */
router.get('/users/:id', (req, res) => {
  const user = getUsers().find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: true, message: 'User not found' });
  const { password, ...safe } = user;
  res.json({ error: false, user: safe });
});

/** POST /admin/users - create user */
router.post('/users', async (req, res) => {
  const { name, email, password, isAdmin } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: true, message: 'name, email, password required' });
  }
  const users = getUsers();
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: true, message: 'Email sudah terdaftar' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = { id: uuidv4(), name, email, password: hashed, isAdmin: !!isAdmin, createdAt: new Date().toISOString() };
  users.push(user);
  saveUsers(users);
  const { password: _, ...safe } = user;
  res.status(201).json({ error: false, message: 'User created', user: safe });
});

/** PUT /admin/users/:id - update user */
router.put('/users/:id', async (req, res) => {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: true, message: 'User not found' });
  const { name, email, password, isAdmin } = req.body;
  if (name) users[idx].name = name;
  if (email) users[idx].email = email;
  if (password) users[idx].password = await bcrypt.hash(password, 10);
  if (isAdmin !== undefined) users[idx].isAdmin = !!isAdmin;
  saveUsers(users);
  const { password: _, ...safe } = users[idx];
  res.json({ error: false, message: 'User updated', user: safe });
});

/** DELETE /admin/users/:id */
router.delete('/users/:id', (req, res) => {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: true, message: 'User not found' });
  users.splice(idx, 1);
  saveUsers(users);
  res.json({ error: false, message: 'User deleted' });
});

/** GET /admin/stories - all stories */
router.get('/stories', (req, res) => {
  const stories = getStories().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ error: false, stories });
});

/** DELETE /admin/stories/:id */
router.delete('/stories/:id', (req, res) => {
  const stories = getStories();
  const idx = stories.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: true, message: 'Story not found' });
  stories.splice(idx, 1);
  saveStories(stories);
  res.json({ error: false, message: 'Story deleted' });
});

/** GET /admin/stats */
router.get('/stats', (req, res) => {
  const users = getUsers();
  const stories = getStories();
  res.json({
    error: false,
    stats: {
      totalUsers: users.length,
      totalStories: stories.length,
      totalAdmins: users.filter(u => u.isAdmin).length,
      storiesWithLocation: stories.filter(s => s.lat && s.lon).length,
    }
  });
});

module.exports = router;
