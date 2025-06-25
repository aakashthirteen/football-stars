const { Client } = require('pg');

// Direct connection to Railway PostgreSQL
const connectionString = 'postgresql://postgres:XRShIITUrZSizLCaZigqAhWEyciEaAue@roundhouse.proxy.rlwy.net:23430/railway';

async function cleanOldMatches() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // First check what we're about to delete
    console.log('📊 Checking matches before today...');
    const checkResult = await client.query(`
      SELECT COUNT(*) as count FROM matches WHERE match_date < $1
    `, [today]);
    
    const matchCount = parseInt(checkResult.rows[0].count);
    console.log(`Found ${matchCount} matches before today (${today.toDateString()})\n`);
    
    if (matchCount === 0) {
      console.log('✅ No old matches to delete!');
      return;
    }
    
    // Start deletion
    console.log('🗑️  Starting cleanup...');
    
    // Delete match events first (foreign key constraint)
    const eventsResult = await client.query(`
      DELETE FROM match_events 
      WHERE match_id IN (SELECT id FROM matches WHERE match_date < $1)
    `, [today]);
    console.log(`Deleted ${eventsResult.rowCount} match events`);
    
    // Delete player stats
    const statsResult = await client.query(`
      DELETE FROM player_stats 
      WHERE match_id IN (SELECT id FROM matches WHERE match_date < $1)
    `, [today]);
    console.log(`Deleted ${statsResult.rowCount} player stats`);
    
    // Finally delete the matches
    const matchesResult = await client.query(`
      DELETE FROM matches WHERE match_date < $1
    `, [today]);
    console.log(`Deleted ${matchesResult.rowCount} matches`);
    
    // Check remaining matches
    const remainingResult = await client.query('SELECT COUNT(*) as count FROM matches');
    console.log(`\n✅ Cleanup completed! ${remainingResult.rows[0].count} matches remaining in database.`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run it
cleanOldMatches();