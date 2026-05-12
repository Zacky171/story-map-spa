const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config');

const router = express.Router();

/**
 * POST /register
 * Body: { name, email, password }
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: true, message: 'name, email, password required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: true, message: 'Password minimal 6 karakter' });
    }
    
    // Check if email already exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: true, message: 'Email sudah terdaftar' });
    }
    
    // Hash password and create user
    const hashed = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    
    await db.query(
      'INSERT INTO users (id, name, email, password, is_admin, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, name, email, hashed, false, new Date().toISOString()]
    );
    
    res.status(201).json({ error: false, message: 'Registrasi berhasil' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
});

/**
 * POST /login
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: true, message: 'email dan password wajib diisi' });
    }
    
    // Find user by email
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: true, message: 'Email atau password salah' });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: true, message: 'Email atau password salah' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, name: user.name, email: user.email, isAdmin: user.is_admin },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.json({
      error: false,
      message: 'Login berhasil',
      loginResult: { userId: user.id, name: user.name, token }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
});

module.exports = router;
