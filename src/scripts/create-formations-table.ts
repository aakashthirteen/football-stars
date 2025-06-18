import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function createFormationsTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔄 Connecting to database...');
    const client = await pool.connect();
    
    console.log('✅ Connected to database');
    
    // Create match_formations table
    console.log('📋 Creating match_formations table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS match_formations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
        team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        formation VARCHAR(20) NOT NULL,
        game_format VARCHAR(10) CHECK (game_format IN ('5v5', '7v7', '11v11')) DEFAULT '11v11',
        formation_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(match_id, team_id)
      )
    `);
    
    console.log('✅ match_formations table created successfully');
    
    // Verify table exists
    const tableCheck = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'match_formations'
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('✅ Verified: match_formations table exists');
      
      // Check columns
      const columnCheck = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'match_formations'
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Table columns:');
      columnCheck.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.error('❌ ERROR: match_formations table was not created');
    }
    
    client.release();
    console.log('🔄 Database connection released');
    
  } catch (error) {
    console.error('❌ Error creating formations table:', error);
    throw error;
  } finally {
    await pool.end();
    console.log('👋 Database pool closed');
  }
}

// Run the script
createFormationsTable()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });