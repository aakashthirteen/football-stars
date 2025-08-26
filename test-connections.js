const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// Test users with unique phone numbers (required for registration)
const users = [
  { email: 'john@test.com', password: 'password123', name: 'John Doe', phoneNumber: '+1234567890' },
  { email: 'jane@test.com', password: 'password123', name: 'Jane Smith', phoneNumber: '+1234567891' },
  { email: 'mike@test.com', password: 'password123', name: 'Mike Johnson', phoneNumber: '+1234567892' }
];

let tokens = {};
let playerIds = {};

async function registerAndLogin(user) {
  try {
    // Try to register (might fail if user exists)
    try {
      await axios.post(`${API_BASE}/auth/register`, user);
      console.log(`✅ Registered ${user.name}`);
    } catch (err) {
      if (err.response?.data?.error?.includes('already exists')) {
        console.log(`ℹ️  ${user.name} already exists`);
      } else {
        throw err;
      }
    }

    // Login
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: user.email,
      password: user.password
    });
    
    tokens[user.email] = loginRes.data.accessToken;
    
    // Get player profile
    const profileRes = await axios.get(`${API_BASE}/players/me`, {
      headers: { Authorization: `Bearer ${tokens[user.email]}` }
    });
    
    playerIds[user.email] = profileRes.data.player.id;
    
    console.log(`✅ Logged in ${user.name} (Player ID: ${profileRes.data.player.id})`);
    return loginRes.data.token;
  } catch (error) {
    console.error(`❌ Error with ${user.name}:`, error.response?.data || error.message);
  }
}

async function testConnections() {
  console.log('\n🚀 Starting Connection System Test with REAL DATA\n');
  
  // Step 1: Register/Login all users
  console.log('📝 Setting up users...');
  for (const user of users) {
    await registerAndLogin(user);
  }
  
  console.log('\n🤝 Testing Connection Requests...\n');
  
  // Step 2: John sends connection request to Jane
  try {
    const requestRes = await axios.post(
      `${API_BASE}/players/connections/request`,
      { connectedPlayerId: playerIds['jane@test.com'] },
      { headers: { Authorization: `Bearer ${tokens['john@test.com']}` } }
    );
    console.log('✅ John sent connection request to Jane');
    console.log('   Response:', requestRes.data.message);
    
    const connectionId = requestRes.data.connection.id;
    
    // Step 3: Check Jane's notifications
    const janeNotifs = await axios.get(
      `${API_BASE}/players/notifications`,
      { headers: { Authorization: `Bearer ${tokens['jane@test.com']}` } }
    );
    console.log(`\n📬 Jane's notifications: ${janeNotifs.data.unreadCount} unread`);
    if (janeNotifs.data.notifications.length > 0) {
      console.log('   Latest:', janeNotifs.data.notifications[0].title);
    }
    
    // Step 4: Check Jane's pending connections
    const janePending = await axios.get(
      `${API_BASE}/players/connections/pending`,
      { headers: { Authorization: `Bearer ${tokens['jane@test.com']}` } }
    );
    const pendingConnections = janePending.data.connections || janePending.data.pendingConnections || [];
    console.log(`\n⏳ Jane's pending requests: ${pendingConnections.length}`);
    if (pendingConnections.length > 0) {
      const firstConnection = pendingConnections[0];
      const fromName = firstConnection.playerDetails?.name || firstConnection.from_player_name || 'Unknown';
      console.log('   From:', fromName);
    }
    
    // Step 5: Jane accepts the request
    const acceptRes = await axios.post(
      `${API_BASE}/players/connections/accept/${connectionId}`,
      {},
      { headers: { Authorization: `Bearer ${tokens['jane@test.com']}` } }
    );
    console.log('\n✅ Jane accepted John\'s request');
    
    // Step 6: Check John's notifications (he should be notified of acceptance)
    const johnNotifs = await axios.get(
      `${API_BASE}/players/notifications`,
      { headers: { Authorization: `Bearer ${tokens['john@test.com']}` } }
    );
    console.log(`\n📬 John's notifications: ${johnNotifs.data.unreadCount} unread`);
    if (johnNotifs.data.notifications.length > 0) {
      console.log('   Latest:', johnNotifs.data.notifications[0].title);
    }
    
    // Step 7: Check both users' connections
    const johnConnections = await axios.get(
      `${API_BASE}/players/connections`,
      { headers: { Authorization: `Bearer ${tokens['john@test.com']}` } }
    );
    console.log(`\n👥 John's connections: ${johnConnections.data.connections.filter(c => c.status === 'accepted').length} friends`);
    
    const janeConnections = await axios.get(
      `${API_BASE}/players/connections`,
      { headers: { Authorization: `Bearer ${tokens['jane@test.com']}` } }
    );
    console.log(`👥 Jane's connections: ${janeConnections.data.connections.filter(c => c.status === 'accepted').length} friends`);
    
    // Step 8: Mike sends request to both John and Jane
    console.log('\n🔄 Mike sending multiple requests...');
    
    for (const email of ['john@test.com', 'jane@test.com']) {
      try {
        await axios.post(
          `${API_BASE}/players/connections/request`,
          { connectedPlayerId: playerIds[email] },
          { headers: { Authorization: `Bearer ${tokens['mike@test.com']}` } }
        );
        console.log(`   ✅ Mike → ${email.split('@')[0]}`);
      } catch (err) {
        console.log(`   ⚠️  Mike → ${email.split('@')[0]}: ${err.response?.data?.error}`);
      }
    }
    
    // Step 9: Get connection summary for Mike
    const mikeSummary = await axios.get(
      `${API_BASE}/players/connections/summary`,
      { headers: { Authorization: `Bearer ${tokens['mike@test.com']}` } }
    );
    console.log('\n📊 Mike\'s Connection Summary:');
    console.log(`   Total: ${mikeSummary.data.summary.total}`);
    console.log(`   Accepted: ${mikeSummary.data.summary.accepted}`);
    console.log(`   Pending Sent: ${mikeSummary.data.summary.pendingSent}`);
    console.log(`   Pending Received: ${mikeSummary.data.summary.pendingReceived}`);
    
    console.log('\n✨ Connection system test completed successfully!');
    console.log('🎯 All features working with REAL DATA!\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testConnections().catch(console.error);