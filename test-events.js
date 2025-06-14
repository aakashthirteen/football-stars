const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://football_user:football_pass@localhost:5432/football_db'
});

async function testEventData() {
  try {
    console.log('🔍 Testing actual event data in database...');
    
    // Get a match with events
    const matchResult = await pool.query(`
      SELECT m.id, m.status, 
             COUNT(me.id) as event_count
      FROM matches m
      LEFT JOIN match_events me ON m.id = me.match_id
      GROUP BY m.id, m.status
      HAVING COUNT(me.id) > 0
      LIMIT 1
    `);
    
    if (matchResult.rows.length === 0) {
      console.log('❌ No matches with events found');
      return;
    }
    
    const match = matchResult.rows[0];
    console.log('📊 Found match with events:', match);
    
    // Test the exact same query as getMatchEvents
    const eventsResult = await pool.query(`
      SELECT me.*, 
             json_build_object('id', p.id, 'name', p.name, 'position', p.position) as player
      FROM match_events me
      JOIN players p ON me.player_id = p.id
      WHERE me.match_id = $1
      ORDER BY me.minute ASC
    `, [match.id]);
    
    console.log('🎯 Raw event data from getMatchEvents query:');
    eventsResult.rows.forEach((event, index) => {
      console.log(`Event ${index + 1}:`, {
        id: event.id,
        event_type: event.event_type,
        minute: event.minute,
        player_id: event.player_id,
        player_object: event.player,
        player_name: event.player?.name,
        description: event.description
      });
    });
    
    // Also check raw match_events table
    console.log('\n🔍 Raw match_events table data:');
    const rawEvents = await pool.query('SELECT * FROM match_events WHERE match_id = $1', [match.id]);
    console.log('Raw events:', rawEvents.rows);
    
    // Check if players exist
    console.log('\n👥 Available players:');
    const players = await pool.query('SELECT id, name, position FROM players LIMIT 5');
    console.log('Players:', players.rows);
    
  } catch (error) {
    console.error('❌ Error testing events:', error);
  } finally {
    await pool.end();
  }
}

testEventData();