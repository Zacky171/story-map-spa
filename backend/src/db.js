// Simple JSON file-based "database" - no external DB needed
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const STORIES_FILE = path.join(DATA_DIR, 'stories.json');
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'subscriptions.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function readJSON(file, fallback = []) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
  getUsers: () => readJSON(USERS_FILE, []),
  saveUsers: (data) => writeJSON(USERS_FILE, data),
  getStories: () => readJSON(STORIES_FILE, []),
  saveStories: (data) => writeJSON(STORIES_FILE, data),
  getSubscriptions: () => readJSON(SUBSCRIPTIONS_FILE, []),
  saveSubscriptions: (data) => writeJSON(SUBSCRIPTIONS_FILE, data),
};
