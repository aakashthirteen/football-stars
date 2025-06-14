import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function inspectMatchEvents() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Inspecting match_events table for duplicates...\n');
    
    // 1. Get total count of match events
    const totalCount = await pool.query('SELECT COUNT(*) as total FROM match_events');
    console.log('📊 Total match events in database:', totalCount.rows[0].total);
    
    // 2. Get count of unique events (by match_id, player_id, event_type, minute)
    const uniqueCount = await pool.query(`
      SELECT COUNT(DISTINCT (match_id, player_id, event_type, minute)) as unique_events 
      FROM match_events
    `);
    console.log('📊 Unique events (by match_id, player_id, event_type, minute):', uniqueCount.rows[0].unique_events);
    
    const duplicateEventCount = parseInt(totalCount.rows[0].total) - parseInt(uniqueCount.rows[0].unique_events);
    console.log('🚨 Potential duplicate events:', duplicateEventCount);
    
    // 3. Find exact duplicates
    const duplicates = await pool.query(`
      SELECT match_id, player_id, event_type, minute, COUNT(*) as duplicate_count,
             STRING_AGG(id::text, ', ') as event_ids,
             MIN(created_at) as first_created,
             MAX(created_at) as last_created
      FROM match_events 
      GROUP BY match_id, player_id, event_type, minute 
      HAVING COUNT(*) > 1
      ORDER BY duplicate_count DESC, last_created DESC
    `);
    
    if (duplicates.rows.length > 0) {
      console.log('\n🚨 DUPLICATE EVENTS FOUND:');
      console.log('================================');
      for (const dup of duplicates.rows) {
        console.log(`Match: ${dup.match_id.substring(0, 8)}...`);
        console.log(`Player: ${dup.player_id.substring(0, 8)}...`);
        console.log(`Event: ${dup.event_type} at minute ${dup.minute}`);
        console.log(`Duplicates: ${dup.duplicate_count} copies`);
        console.log(`Event IDs: ${dup.event_ids}`);
        console.log(`First created: ${dup.first_created}`);
        console.log(`Last created: ${dup.last_created}`);
        console.log('---');
      }
    } else {
      console.log('\n✅ No duplicate events found!');
    }
    
    // 4. Get recent events for inspection
    console.log('\n📋 Recent match events (last 20):');
    console.log('==================================');
    const recentEvents = await pool.query(`
      SELECT me.id, me.match_id, me.player_id, me.event_type, me.minute, me.created_at,
             p.name as player_name
      FROM match_events me
      LEFT JOIN players p ON me.player_id = p.id
      ORDER BY me.created_at DESC
      LIMIT 20
    `);
    
    for (const event of recentEvents.rows) {
      console.log(`${event.event_type} | ${event.player_name || 'Unknown'} | Min ${event.minute} | ${event.created_at}`);
    }
    
    // 5. Check for specific player stats to compare with frontend
    console.log('\n📊 Player statistics from database:');
    console.log('===================================');
    const playerStats = await pool.query(`
      SELECT 
        p.name as player_name,
        COUNT(CASE WHEN me.event_type = 'GOAL' THEN 1 END) as goals,
        COUNT(CASE WHEN me.event_type = 'ASSIST' THEN 1 END) as assists,
        COUNT(*) as total_events
      FROM players p
      LEFT JOIN match_events me ON p.id = me.player_id
      GROUP BY p.id, p.name
      HAVING COUNT(me.id) > 0
      ORDER BY goals DESC, total_events DESC
      LIMIT 10
    `);
    
    for (const stat of playerStats.rows) {
      console.log(`${stat.player_name}: ${stat.goals} goals, ${stat.assists} assists (${stat.total_events} total events)`);
    }
    
    // 6. Check for rapid-fire events (same player, same minute, within seconds)
    console.log('\n⚡ Checking for rapid-fire events (same player/minute within 10 seconds):');
    console.log('================================================================');
    const rapidFire = await pool.query(`
      SELECT 
        me1.match_id,
        me1.player_id,
        p.name as player_name,
        me1.event_type,
        me1.minute,
        me1.created_at as event1_time,
        me2.created_at as event2_time,
        EXTRACT(EPOCH FROM (me2.created_at - me1.created_at)) as seconds_between
      FROM match_events me1
      JOIN match_events me2 ON me1.match_id = me2.match_id 
        AND me1.player_id = me2.player_id 
        AND me1.event_type = me2.event_type
        AND me1.minute = me2.minute
        AND me1.id != me2.id
        AND me2.created_at > me1.created_at
        AND me2.created_at <= me1.created_at + INTERVAL '10 seconds'
      LEFT JOIN players p ON me1.player_id = p.id
      ORDER BY me1.created_at DESC
      LIMIT 10
    `);
    
    if (rapidFire.rows.length > 0) {
      console.log('🚨 RAPID-FIRE DUPLICATES DETECTED:');
      for (const rf of rapidFire.rows) {
        console.log(`${rf.player_name}: ${rf.event_type} at minute ${rf.minute}`);
        console.log(`  First: ${rf.event1_time}`);
        console.log(`  Second: ${rf.event2_time}`);
        console.log(`  Gap: ${rf.seconds_between} seconds`);
        console.log('---');
      }
    } else {
      console.log('✅ No rapid-fire duplicates found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
inspectMatchEvents();