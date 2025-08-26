const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/football_stars_dev';

async function cleanup() {
  const client = new Client({
    connectionString: DATABASE_URL
  });

  try {
    await client.connect();
    console.log('🗑️  Cleaning up test data...');
    
    // Delete all connections
    const connRes = await client.query('DELETE FROM player_connections');
    console.log(`   Deleted ${connRes.rowCount} connections`);
    
    // Delete all notifications
    const notifRes = await client.query('DELETE FROM notifications');
    console.log(`   Deleted ${notifRes.rowCount} notifications`);
    
    console.log('✅ Cleanup complete!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

cleanup();