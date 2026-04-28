const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getStories, saveStories } = require('../db');
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
router.get('/', authMiddleware, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const size = parseInt(req.query.size) || 10;
  const location = req.query.location === '1';

  let stories = getStories().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (!location) {
    stories = stories.map(({ lat, lon, ...s }) => s);
  }

  const start = (page - 1) * size;
  const listStory = stories.slice(start, start + size);

  res.json({ error: false, message: 'Stories fetched', listStory });
});

/**
 * GET /stories/:id
 */
router.get('/:id', authMiddleware, (req, res) => {
  const stories = getStories();
  const story = stories.find(s => s.id === req.params.id);
  if (!story) return res.status(404).json({ error: true, message: 'Story not found' });
  res.json({ error: false, story });
});

/**
 * POST /stories
 * FormData: photo (file), description, lat, lon
 */
router.post('/', authMiddleware, upload.single('photo'), (req, res) => {
  const { description, lat, lon } = req.body;
  if (!description) {
    return res.status(400).json({ error: true, message: 'description wajib diisi' });
  }
  const stories = getStories();
  const photoUrl = req.file
    ? `/uploads/${req.file.filename}`
    : null;

  const story = {
    id: uuidv4(),
    name: req.user.name,
    userId: req.user.userId,
    description,
    photoUrl,
    lat: lat ? parseFloat(lat) : null,
    lon: lon ? parseFloat(lon) : null,
    createdAt: new Date().toISOString(),
  };
  stories.push(story);
  saveStories(stories);
  res.status(201).json({ error: false, message: 'Story berhasil ditambahkan', story });
});

/**
 * PUT /stories/:id  (admin or owner)
 */
router.put('/:id', authMiddleware, upload.single('photo'), (req, res) => {
  const stories = getStories();
  const idx = stories.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: true, message: 'Story not found' });

  const story = stories[idx];
  if (story.userId !== req.user.userId && !req.user.isAdmin) {
    return res.status(403).json({ error: true, message: 'Forbidden' });
  }

  const { description, lat, lon } = req.body;
  if (description) story.description = description;
  if (lat) story.lat = parseFloat(lat);
  if (lon) story.lon = parseFloat(lon);
  if (req.file) story.photoUrl = `/uploads/${req.file.filename}`;

  stories[idx] = story;
  saveStories(stories);
  res.json({ error: false, message: 'Story updated', story });
});

/**
 * DELETE /stories/:id  (admin or owner)
 */
router.delete('/:id', authMiddleware, (req, res) => {
  const stories = getStories();
  const idx = stories.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: true, message: 'Story not found' });

  const story = stories[idx];
  if (story.userId !== req.user.userId && !req.user.isAdmin) {
    return res.status(403).json({ error: true, message: 'Forbidden' });
  }

  stories.splice(idx, 1);
  saveStories(stories);
  res.json({ error: false, message: 'Story deleted' });
});

module.exports = router;
