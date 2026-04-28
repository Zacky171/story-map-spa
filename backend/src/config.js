module.exports = {
  PORT: process.env.PORT || 3001,
  JWT_SECRET: process.env.JWT_SECRET || 'storymap-secret-key-2026',
  JWT_EXPIRES_IN: '7d',
  UPLOAD_DIR: require('path').join(__dirname, '../uploads'),
};
