// Database Initialization & Migration Script
const { pool } = require('./db');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database initialization...\n');

    // Drop existing tables (for clean setup)
    console.log('🗑️  Dropping existing tables...');
    await client.query('DROP TABLE IF EXISTS subscriptions CASCADE');
    await client.query('DROP TABLE IF EXISTS stories CASCADE');
    await client.query('DROP TABLE IF EXISTS users CASCADE');
    console.log('✅ Tables dropped\n');

    // Create users table
    console.log('📦 Creating users table...');
    await client.query(`
      CREATE TABLE users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created\n');

    // Create stories table
    console.log('📦 Creating stories table...');
    await client.query(`
      CREATE TABLE stories (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        photo_url TEXT,
        lat DECIMAL(10, 8),
        lon DECIMAL(11, 8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Stories table created\n');

    // Create subscriptions table
    console.log('📦 Creating subscriptions table...');
    await client.query(`
      CREATE TABLE subscriptions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT UNIQUE NOT NULL,
        keys JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Subscriptions table created\n');

    // Create indexes for performance
    console.log('⚡ Creating indexes...');
    await client.query('CREATE INDEX idx_stories_user_id ON stories(user_id)');
    await client.query('CREATE INDEX idx_stories_created_at ON stories(created_at DESC)');
    await client.query('CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id)');
    console.log('✅ Indexes created\n');

    // Migrate data from JSON files
    console.log('📥 Migrating data from JSON files...\n');

    // Migrate users
    const usersFile = path.join(__dirname, '../data/users.json');
    if (fs.existsSync(usersFile)) {
      const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
      console.log(`   Migrating ${users.length} users...`);
      
      for (const user of users) {
        await client.query(
          'INSERT INTO users (id, name, email, password, is_admin, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
          [user.id, user.name, user.email, user.password, user.isAdmin, user.createdAt]
        );
      }
      console.log(`   ✅ ${users.length} users migrated\n`);
    }

    // Migrate stories
    const storiesFile = path.join(__dirname, '../data/stories.json');
    if (fs.existsSync(storiesFile)) {
      const stories = JSON.parse(fs.readFileSync(storiesFile, 'utf8'));
      console.log(`   Migrating ${stories.length} stories...`);
      
      for (const story of stories) {
        await client.query(
          'INSERT INTO stories (id, user_id, name, description, photo_url, lat, lon, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [story.id, story.userId, story.name, story.description, story.photoUrl, story.lat, story.lon, story.createdAt]
        );
      }
      console.log(`   ✅ ${stories.length} stories migrated\n`);
    }

    // Migrate subscriptions
    const subsFile = path.join(__dirname, '../data/subscriptions.json');
    if (fs.existsSync(subsFile)) {
      const subs = JSON.parse(fs.readFileSync(subsFile, 'utf8'));
      if (subs.length > 0) {
        console.log(`   Migrating ${subs.length} subscriptions...`);
        
        for (const sub of subs) {
          await client.query(
            'INSERT INTO subscriptions (user_id, endpoint, keys, created_at) VALUES ($1, $2, $3, $4)',
            [sub.userId, sub.endpoint, JSON.stringify(sub.keys), sub.createdAt]
          );
        }
        console.log(`   ✅ ${subs.length} subscriptions migrated\n`);
      } else {
        console.log('   ℹ️  No subscriptions to migrate\n');
      }
    }

    console.log('🎉 Database initialization completed successfully!\n');
    console.log('📊 Summary:');
    
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const storyCount = await client.query('SELECT COUNT(*) FROM stories');
    const subCount = await client.query('SELECT COUNT(*) FROM subscriptions');
    
    console.log(`   - Users: ${userCount.rows[0].count}`);
    console.log(`   - Stories: ${storyCount.rows[0].count}`);
    console.log(`   - Subscriptions: ${subCount.rows[0].count}\n`);

  } catch (error) {
    console.error('❌ Error during initialization:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run initialization
initDatabase()
  .then(() => {
    console.log('✅ Done! You can now start the server with: npm start');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Failed:', err);
    process.exit(1);
  });
