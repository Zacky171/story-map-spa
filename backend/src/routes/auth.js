const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getUsers, saveUsers } = require('../db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config');

const router = express.Router();

/**
 * POST /register
 * Body: { name, email, password }
 */
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: true, message: 'name, email, password required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: true, message: 'Password minimal 6 karakter' });
  }
  const users = getUsers();
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: true, message: 'Email sudah terdaftar' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = { id: uuidv4(), name, email, password: hashed, isAdmin: false, createdAt: new Date().toISOString() };
  users.push(user);
  saveUsers(users);
  res.status(201).json({ error: false, message: 'Registrasi berhasil' });
});

/**
 * POST /login
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: true, message: 'email dan password wajib diisi' });
  }
  const users = getUsers();
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: true, message: 'Email atau password salah' });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: true, message: 'Email atau password salah' });
  }
  const token = jwt.sign(
    { userId: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  res.json({
    error: false,
    message: 'Login berhasil',
    loginResult: { userId: user.id, name: user.name, token }
  });
});

module.exports = router;
