import { database } from '../models/databaseFactory';
import { PostgresDatabase } from '../models/postgresDatabase';

/**
 * Database migration to add SSE timer tracking fields
 * Run this script to update your database schema
 */
async function migrateTimerFields() {
  const db = database as PostgresDatabase;
  
  console.log('🔄 Starting timer fields migration...');
  
  try {
    // Add timer tracking columns
    await db.pool.query(`
      ALTER TABLE matches 
      ADD COLUMN IF NOT EXISTS timer_started_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS halftime_started_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS second_half_started_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS timer_paused_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS total_paused_duration INTEGER DEFAULT 0
    `);
    
    console.log('✅ Added timer tracking columns');
    
    // Add index for performance
    await db.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_matches_timer_status 
      ON matches(status, timer_started_at)
    `);
    
    console.log('✅ Added timer status index');
    
    // Update existing LIVE matches to have timer_started_at
    const result = await db.pool.query(`
      UPDATE matches 
      SET timer_started_at = match_date 
      WHERE status = 'LIVE' 
      AND timer_started_at IS NULL
    `);
    
    console.log(`✅ Updated ${result.rowCount} live matches with timer start time`);
    
    // Verify migration
    const columns = await db.pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'matches' 
      AND column_name IN (
        'timer_started_at', 
        'halftime_started_at', 
        'second_half_started_at',
        'timer_paused_at',
        'total_paused_duration'
      )
    `);
    
    console.log(`✅ Migration complete! Found ${columns.rowCount} timer columns`);
    
    // Show sample data
    const sampleMatch = await db.pool.query(`
      SELECT id, status, timer_started_at, halftime_started_at 
      FROM matches 
      WHERE status IN ('LIVE', 'HALFTIME') 
      LIMIT 1
    `);
    
    if (sampleMatch.rows.length > 0) {
      console.log('📊 Sample match with timer data:', sampleMatch.rows[0]);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateTimerFields()
    .then(() => {
      console.log('✅ Timer fields migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Timer fields migration failed:', error);
      process.exit(1);
    });
}

export { migrateTimerFields };
