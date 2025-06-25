const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = 'https://football-stars-production.up.railway.app';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmMzZiZGJhNy01OWJmLTQ4ZjQtOTFmYi1kODJjNzU1NGUwMGIiLCJpYXQiOjE3MzQ5NzgyODYsImV4cCI6MTczNzU3MDI4Nn0.h3BZ8Y9ezS1Y_iT6EEKdGQvQGJMGrGGEPtGJgT1qPYo'; // Replace with your actual token

async function cleanOldMatches() {
  try {
    console.log('🧹 Cleaning old matches via API...\n');
    
    // First get match statistics
    console.log('📊 Getting current match statistics...');
    const statsResponse = await fetch(`${API_BASE_URL}/api/admin/match-stats`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!statsResponse.ok) {
      throw new Error(`Failed to get stats: ${statsResponse.status} ${statsResponse.statusText}`);
    }
    
    const stats = await statsResponse.json();
    console.log('\nCurrent match statistics:');
    console.log(`- Total matches: ${stats.stats.total_matches}`);
    console.log(`- Live matches: ${stats.stats.live_matches}`);
    console.log(`- Completed matches: ${stats.stats.completed_matches}`);
    console.log(`- Past matches (before today): ${stats.stats.past_matches}`);
    console.log(`- Today and future: ${stats.stats.today_and_future}`);
    
    if (stats.stats.past_matches === 0) {
      console.log('\n✅ No old matches to clean!');
      return;
    }
    
    // Proceed with cleanup
    console.log(`\n⚠️  About to delete ${stats.stats.past_matches} old matches...`);
    console.log('🗑️  Cleaning old matches...');
    
    const cleanResponse = await fetch(`${API_BASE_URL}/api/admin/clean-matches`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!cleanResponse.ok) {
      const errorText = await cleanResponse.text();
      throw new Error(`Failed to clean matches: ${cleanResponse.status} ${cleanResponse.statusText} - ${errorText}`);
    }
    
    const result = await cleanResponse.json();
    console.log('\n✅ Cleanup completed!');
    console.log(`- Deleted ${result.deletedCounts.matches} matches`);
    console.log(`- Deleted ${result.deletedCounts.events} match events`);
    console.log(`- Deleted ${result.deletedCounts.stats} player stats`);
    
    // Get updated statistics
    console.log('\n📊 Getting updated match statistics...');
    const updatedStatsResponse = await fetch(`${API_BASE_URL}/api/admin/match-stats`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (updatedStatsResponse.ok) {
      const updatedStats = await updatedStatsResponse.json();
      console.log(`\n✅ Remaining matches in database: ${updatedStats.stats.total_matches}`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the cleanup
cleanOldMatches()
  .then(() => {
    console.log('\n🎯 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });