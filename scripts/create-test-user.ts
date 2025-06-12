import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function createTestUser() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Checking for existing test user...');
    
    // Check if user exists
    const checkUser = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      ['test@test.com']
    );

    if (checkUser.rows.length > 0) {
      console.log('✅ Test user already exists:', checkUser.rows[0]);
      
      // Update password to ensure it's correct
      const hashedPassword = await bcrypt.hash('password123', 10);
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE email = $2',
        [hashedPassword, 'test@test.com']
      );
      console.log('✅ Password updated to: password123');
    } else {
      console.log('📝 Creating test user...');
      
      // Create user
      const hashedPassword = await bcrypt.hash('password123', 10);
      const userResult = await pool.query(
        'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
        ['test@test.com', hashedPassword, 'Test User']
      );
      
      console.log('✅ User created:', userResult.rows[0]);
      
      // Create player profile
      const playerId = await pool.query(
        'INSERT INTO players (user_id, name, position, bio, location) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [userResult.rows[0].id, 'Test User', 'MID', 'Test player for demo', 'Mumbai']
      );
      
      console.log('✅ Player profile created');
    }

    // List all users
    console.log('\n📋 All users in database:');
    const allUsers = await pool.query('SELECT id, email, name FROM users');
    console.table(allUsers.rows);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
createTestUser();
