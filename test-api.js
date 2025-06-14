const fetch = require('node-fetch');

async function testMatchAPI() {
  try {
    // First, get all matches
    const matchesResponse = await fetch('http://localhost:3001/api/matches', {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // You'll need a valid token
      }
    });
    
    const matches = await matchesResponse.json();
    console.log('Matches:', matches);
    
    if (matches.matches && matches.matches.length > 0) {
      // Get details of the first match
      const matchId = matches.matches[0].id;
      const matchResponse = await fetch(`http://localhost:3001/api/matches/${matchId}`, {
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN_HERE' // You'll need a valid token
        }
      });
      
      const matchDetails = await matchResponse.json();
      console.log('\nMatch Details:', JSON.stringify(matchDetails, null, 2));
      
      // Check team and player data
      if (matchDetails.match) {
        console.log('\nHome Team:', matchDetails.match.homeTeam);
        console.log('Home Team Players:', matchDetails.match.homeTeam?.players);
        console.log('\nAway Team:', matchDetails.match.awayTeam);
        console.log('Away Team Players:', matchDetails.match.awayTeam?.players);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Note: You'll need to get a valid auth token first
console.log('To test the API, you need to:');
console.log('1. Login to get an auth token');
console.log('2. Replace YOUR_TOKEN_HERE with the actual token');
console.log('3. Run: node test-api.js');