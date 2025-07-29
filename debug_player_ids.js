const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function debugPlayerData() {
  try {
    console.log('🔍 Investigating player ID mismatch...\n');
    
    // Check players table
    const playersResult = await pool.query('SELECT id, name, user_id FROM players ORDER BY created_at DESC LIMIT 5');
    console.log('📊 Recent players in players table:');
    playersResult.rows.forEach(player => {
      console.log(`  - Player ID: ${player.id}, Name: ${player.name}, User ID: ${player.user_id}`);
    });
    
    // Check match_events table
    const eventsResult = await pool.query('SELECT DISTINCT player_id FROM match_events LIMIT 10');
    console.log('\n📊 Player IDs in match_events table:');
    eventsResult.rows.forEach(event => {
      console.log(`  - Player ID: ${event.player_id}`);
    });
    
    // Check for a specific user's data
    const userResult = await pool.query(`
      SELECT u.id as user_id, u.name as user_name, p.id as player_id 
      FROM users u 
      LEFT JOIN players p ON u.id = p.user_id 
      WHERE u.name ILIKE '%aakash%' OR u.email ILIKE '%aakash%'
      LIMIT 3
    `);
    console.log('\n📊 User-to-Player mapping for test user:');
    userResult.rows.forEach(user => {
      console.log(`  - User ID: ${user.user_id}, Name: ${user.user_name}, Player ID: ${user.player_id}`);
    });
    
    // Check match events for any of the players
    if (playersResult.rows.length > 0) {
      const testPlayerId = playersResult.rows[0].id;
      const testPlayerEvents = await pool.query(`
        SELECT event_type, COUNT(*) as count 
        FROM match_events 
        WHERE player_id = $1 
        GROUP BY event_type
      `, [testPlayerId]);
      
      console.log(`\n📊 Events for player ${testPlayerId} (${playersResult.rows[0].name}):`);
      if (testPlayerEvents.rows.length === 0) {
        console.log('  - NO EVENTS FOUND! This is the problem.');
      } else {
        testPlayerEvents.rows.forEach(event => {
          console.log(`  - ${event.event_type}: ${event.count}`);
        });
      }
      
      // Check if there are any events with different player IDs
      const allEventsCount = await pool.query('SELECT COUNT(*) FROM match_events');
      console.log(`\n📊 Total match events in database: ${allEventsCount.rows[0].count}`);
      
      if (parseInt(allEventsCount.rows[0].count) > 0) {
        const sampleEvents = await pool.query(`
          SELECT player_id, event_type, COUNT(*) as count 
          FROM match_events 
          GROUP BY player_id, event_type 
          ORDER BY count DESC 
          LIMIT 5
        `);
        console.log('\n📊 Sample events by player_id:');
        sampleEvents.rows.forEach(event => {
          console.log(`  - Player ID: ${event.player_id}, Event: ${event.event_type}, Count: ${event.count}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await pool.end();
  }
}

debugPlayerData();