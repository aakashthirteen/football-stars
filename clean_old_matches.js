const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function cleanOldMatches() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Starting cleanup of old matches...\n');
    
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // First, let's see what we're about to delete
    const checkResult = await client.query(`
      SELECT 
        m.id,
        m.status,
        m.match_date,
        ht.name as home_team,
        at.name as away_team,
        m.home_score,
        m.away_score
      FROM matches m
      LEFT JOIN teams ht ON m.home_team_id = ht.id
      LEFT JOIN teams at ON m.away_team_id = at.id
      WHERE m.match_date < $1
      ORDER BY m.match_date DESC
    `, [today]);
    
    console.log(`Found ${checkResult.rows.length} matches before today (${today.toDateString()}):\n`);
    
    if (checkResult.rows.length === 0) {
      console.log('No old matches to delete.');
      return;
    }
    
    // Display matches that will be deleted
    checkResult.rows.forEach(match => {
      console.log(`- ${match.home_team} vs ${match.away_team} (${match.home_score}-${match.away_score}) - ${new Date(match.match_date).toLocaleString()} [${match.status}]`);
    });
    
    console.log('\n⚠️  These matches will be permanently deleted!');
    console.log('This will also delete associated match events, player stats, and other related data.\n');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Delete related data first (due to foreign key constraints)
    console.log('🗑️  Deleting match events...');
    const eventsResult = await client.query(`
      DELETE FROM match_events 
      WHERE match_id IN (
        SELECT id FROM matches WHERE match_date < $1
      )
    `, [today]);
    console.log(`   Deleted ${eventsResult.rowCount} match events`);
    
    console.log('🗑️  Deleting player stats...');
    const statsResult = await client.query(`
      DELETE FROM player_stats 
      WHERE match_id IN (
        SELECT id FROM matches WHERE match_date < $1
      )
    `, [today]);
    console.log(`   Deleted ${statsResult.rowCount} player stat records`);
    
    // Delete the matches
    console.log('🗑️  Deleting matches...');
    const matchesResult = await client.query(`
      DELETE FROM matches 
      WHERE match_date < $1
    `, [today]);
    console.log(`   Deleted ${matchesResult.rowCount} matches`);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('\n✅ Cleanup completed successfully!');
    
    // Show remaining matches
    const remainingResult = await client.query(`
      SELECT COUNT(*) as count FROM matches
    `);
    console.log(`\n📊 Remaining matches in database: ${remainingResult.rows[0].count}`);
    
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('❌ Error during cleanup:', error.message);
    throw error;
  } finally {
    client.release();
    pool.end();
  }
}

// Run the cleanup
cleanOldMatches()
  .then(() => {
    console.log('\n🎯 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Cleanup failed:', error);
    process.exit(1);
  });