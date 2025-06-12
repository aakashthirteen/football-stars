const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupTestUser() {
  // Use your Railway DATABASE_URL
  const connectionString = process.env.DATABASE_URL || 'your-railway-database-url-here';
  
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Create test user with known password
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // First, delete existing test user if any
    await pool.query('DELETE FROM users WHERE email = $1', ['test@test.com']);
    
    // Create new test user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING *',
      ['test@test.com', hashedPassword, 'Test User']
    );
    
    console.log('✅ Test user created:', result.rows[0]);
    console.log('📧 Email: test@test.com');
    console.log('🔑 Password: password123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

setupTestUser();
