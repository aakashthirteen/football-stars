// Script to check and populate teams with players if needed
const fetch = require('node-fetch');

async function checkAndPopulateTeams(authToken) {
  try {
    // First check if teams have players
    const teamsResponse = await fetch('http://localhost:3001/api/teams', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const teamsData = await teamsResponse.json();
    console.log('Teams data:', teamsData);
    
    // Check if we need to populate teams
    if (teamsData.teams && teamsData.teams.length > 0) {
      const teamsWithoutPlayers = teamsData.teams.filter(team => 
        !team.players || team.players.length === 0
      );
      
      if (teamsWithoutPlayers.length > 0) {
        console.log(`\nFound ${teamsWithoutPlayers.length} teams without players`);
        console.log('Populating teams with players...');
        
        // Call the populate endpoint
        const populateResponse = await fetch('http://localhost:3001/api/teams/populate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        const populateResult = await populateResponse.json();
        console.log('Populate result:', populateResult);
      } else {
        console.log('\nAll teams have players assigned!');
      }
    }
    
    // Now check a specific match
    const matchesResponse = await fetch('http://localhost:3001/api/matches', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const matchesData = await matchesResponse.json();
    if (matchesData.matches && matchesData.matches.length > 0) {
      const matchId = matchesData.matches[0].id;
      console.log(`\nChecking match ${matchId}...`);
      
      const matchResponse = await fetch(`http://localhost:3001/api/matches/${matchId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      const matchDetails = await matchResponse.json();
      console.log('\nMatch details:');
      console.log('Home team:', matchDetails.match?.homeTeam?.name, 
                  '- Players:', matchDetails.match?.homeTeam?.players?.length || 0);
      console.log('Away team:', matchDetails.match?.awayTeam?.name,
                  '- Players:', matchDetails.match?.awayTeam?.players?.length || 0);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Instructions
console.log('To use this script:');
console.log('1. Get an auth token by logging in');
console.log('2. Run: node populate-teams.js YOUR_AUTH_TOKEN');

// Get token from command line
const token = process.argv[2];
if (token) {
  checkAndPopulateTeams(token);
} else {
  console.log('\nNo token provided!');
}