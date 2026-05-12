const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { UPLOAD_DIR } = require('../config');
const fs = require('fs');

const router = express.Router();

// Ensure uploads dir exists
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

/**
 * GET /stories
 * Query: page, size, location (1=include lat/lon)
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;
    const location = req.query.location === '1';
    const offset = (page - 1) * size;

    let query = 'SELECT * FROM stories ORDER BY created_at DESC LIMIT $1 OFFSET $2';
    const result = await db.query(query, [size, offset]);

    let listStory = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      userId: row.user_id,
      description: row.description,
      photoUrl: row.photo_url,
      ...(location && { lat: row.lat, lon: row.lon }),
      createdAt: row.created_at
    }));

    res.json({ error: false, message: 'Stories fetched', listStory });
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
});

/**
 * GET /stories/:id
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM stories WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Story not found' });
    }

    const row = result.rows[0];
    const story = {
      id: row.id,
      name: row.name,
      userId: row.user_id,
      description: row.description,
      photoUrl: row.photo_url,
      lat: row.lat,
      lon: row.lon,
      createdAt: row.created_at
    };

    res.json({ error: false, story });
  } catch (error) {
    console.error('Get story error:', error);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
});

/**
 * POST /stories
 * FormData: photo (file), description, lat, lon
 */
router.post('/', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    const { description, lat, lon } = req.body;
    
    if (!description) {
      return res.status(400).json({ error: true, message: 'description wajib diisi' });
    }

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const storyId = uuidv4();

    const result = await db.query(
      'INSERT INTO stories (id, user_id, name, description, photo_url, lat, lon, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [storyId, req.user.userId, req.user.name, description, photoUrl, lat ? parseFloat(lat) : null, lon ? parseFloat(lon) : null, new Date().toISOString()]
    );

    const row = result.rows[0];
    const story = {
      id: row.id,
      name: row.name,
      userId: row.user_id,
      description: row.description,
      photoUrl: row.photo_url,
      lat: row.lat,
      lon: row.lon,
      createdAt: row.created_at
    };

    res.status(201).json({ error: false, message: 'Story berhasil ditambahkan', story });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
});

/**
 * PUT /stories/:id  (admin or owner)
 */
router.put('/:id', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM stories WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Story not found' });
    }

    const story = result.rows[0];
    
    if (story.user_id !== req.user.userId && !req.user.isAdmin) {
      return res.status(403).json({ error: true, message: 'Forbidden' });
    }

    const { description, lat, lon } = req.body;
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : story.photo_url;

    const updated = await db.query(
      'UPDATE stories SET description = $1, photo_url = $2, lat = $3, lon = $4 WHERE id = $5 RETURNING *',
      [description || story.description, photoUrl, lat ? parseFloat(lat) : story.lat, lon ? parseFloat(lon) : story.lon, req.params.id]
    );

    const row = updated.rows[0];
    const updatedStory = {
      id: row.id,
      name: row.name,
      userId: row.user_id,
      description: row.description,
      photoUrl: row.photo_url,
      lat: row.lat,
      lon: row.lon,
      createdAt: row.created_at
    };

    res.json({ error: false, message: 'Story updated', story: updatedStory });
  } catch (error) {
    console.error('Update story error:', error);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
});

/**
 * DELETE /stories/:id  (admin or owner)
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM stories WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Story not found' });
    }

    const story = result.rows[0];
    
    if (story.user_id !== req.user.userId && !req.user.isAdmin) {
      return res.status(403).json({ error: true, message: 'Forbidden' });
    }

    await db.query('DELETE FROM stories WHERE id = $1', [req.params.id]);

    res.json({ error: false, message: 'Story deleted' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
});

module.exports = router;
