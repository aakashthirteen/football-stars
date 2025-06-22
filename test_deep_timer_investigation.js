// DEEP TIMER INVESTIGATION - Find the REAL root cause of timer skipping
// This test will monitor actual timer progression in real-time to catch the exact issue

const { scalableFootballTimer } = require('./dist/services/sse/ScalableFootballTimerService');
// Use fetch with streaming for SSE simulation since EventSource has version issues
const fetch = require('node-fetch');

async function deepTimerInvestigation() {
  console.log('🔬 DEEP TIMER INVESTIGATION - FINDING REAL ROOT CAUSE');
  console.log('=====================================================');
  console.log('Problem: Timer still skipping 2-3 seconds (sometimes 5)');
  console.log('Goal: Find the EXACT technical reason for this behavior\n');

  try {
    // Mock database
    require('./dist/models/databaseFactory').database.getMatchById = async (id) => ({
      id, duration: 5, status: 'SCHEDULED'
    });
    require('./dist/models/databaseFactory').database.updateMatch = async (id, updates) => {
      return { id, ...updates };
    };

    const matchId = 'deep-investigation-test';
    
    console.log('🚀 PHASE 1: BACKEND TIMER BEHAVIOR ANALYSIS');
    console.log('==========================================');
    
    // Start match with backend timer
    await scalableFootballTimer.startMatch(matchId);
    console.log('✅ Match started with scalable timer service');
    
    // Monitor backend state every 100ms for 20 seconds
    const backendReadings = [];
    const startTime = Date.now();
    
    console.log('\n📊 BACKEND STATE MONITORING (every 100ms):');
    console.log('Time(ms) | Elapsed(s) | Display | Backend Calc | Drift');
    console.log('---------|------------|---------|--------------|------');
    
    const backendMonitor = setInterval(() => {
      const now = Date.now();
      const realElapsed = (now - startTime) / 1000;
      
      const state = scalableFootballTimer.getMatchState(matchId);
      if (state) {
        const backendElapsed = now - state.startedAt - state.totalPausedMs;
        const backendSeconds = Math.floor(backendElapsed / 1000);
        const displayMinute = Math.floor(backendSeconds / 60);
        const displaySecond = backendSeconds % 60;
        const drift = Math.abs(realElapsed - backendSeconds);
        
        const reading = {
          timestamp: now,
          realElapsed: realElapsed.toFixed(1),
          backendSeconds,
          displayTime: `${displayMinute}:${displaySecond.toString().padStart(2, '0')}`,
          drift: drift.toFixed(1)
        };
        
        backendReadings.push(reading);
        
        if (backendReadings.length <= 20) { // Only show first 20 readings
          console.log(`${reading.realElapsed.padStart(6)}s   | ${reading.backendSeconds.toString().padStart(8)}s   | ${reading.displayTime.padStart(5)} | ${reading.backendSeconds.toString().padStart(10)}s | ${reading.drift}s`);
        }
        
        // Check for big jumps
        if (backendReadings.length > 1) {
          const prevReading = backendReadings[backendReadings.length - 2];
          const timeDiff = (reading.timestamp - prevReading.timestamp) / 1000;
          const secondsDiff = reading.backendSeconds - prevReading.backendSeconds;
          
          if (secondsDiff > timeDiff + 1) { // Jump detected
            console.log(`🚨 JUMP DETECTED: Backend jumped ${secondsDiff} seconds in ${timeDiff.toFixed(1)}s real time!`);
          }
        }
      }
    }, 100);
    
    // Stop backend monitoring after 10 seconds
    setTimeout(() => {
      clearInterval(backendMonitor);
      console.log('\n📈 BACKEND ANALYSIS RESULTS:');
      
      // Analyze backend consistency
      let jumpCount = 0;
      let maxJump = 0;
      
      for (let i = 1; i < Math.min(backendReadings.length, 100); i++) {
        const prev = backendReadings[i-1];
        const curr = backendReadings[i];
        const realTimeDiff = (curr.timestamp - prev.timestamp) / 1000;
        const backendDiff = curr.backendSeconds - prev.backendSeconds;
        
        if (backendDiff > realTimeDiff + 0.5) { // More than 0.5s jump
          jumpCount++;
          maxJump = Math.max(maxJump, backendDiff - realTimeDiff);
        }
      }
      
      console.log(`📊 Backend jumps detected: ${jumpCount}`);
      console.log(`📊 Maximum jump: ${maxJump.toFixed(1)} seconds`);
      console.log(`📊 Backend timing consistency: ${jumpCount === 0 ? '✅ GOOD' : '❌ PROBLEMATIC'}`);
      
      if (jumpCount > 0) {
        console.log('\n🎯 ROOT CAUSE CANDIDATE: Backend timer calculation is inconsistent');
      }
      
      // Phase 2: SSE Message Delivery Analysis
      startSSEAnalysis(matchId);
      
    }, 10000);
    
  } catch (error) {
    console.error('❌ Deep investigation failed:', error.message);
  }
}

function startSSEAnalysis(matchId) {
  console.log('\n🚀 PHASE 2: SSE MESSAGE DELIVERY ANALYSIS');
  console.log('=========================================');
  
  // Simulate SSE client connection
  const sseUrl = `http://localhost:3001/sse/${matchId}/timer-stream`;
  console.log(`📡 Connecting to: ${sseUrl}`);
  
  const eventSource = new EventSource(sseUrl);
  const sseReadings = [];
  let lastSSETime = null;
  
  console.log('\n📨 SSE MESSAGE TIMING ANALYSIS:');
  console.log('Message# | Real Time | SSE Data | Time Gap | Processing Delay');
  console.log('---------|-----------|----------|----------|------------------');
  
  eventSource.onmessage = function(event) {
    const receiveTime = Date.now();
    
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'timer_update' && data.state) {
        const reading = {
          timestamp: receiveTime,
          serverTime: data.state.serverTime || receiveTime,
          totalSeconds: data.state.totalSeconds,
          currentMinute: data.state.currentMinute,
          currentSecond: data.state.currentSecond,
          messageNumber: sseReadings.length + 1
        };
        
        sseReadings.push(reading);
        
        // Calculate delays
        const networkDelay = receiveTime - reading.serverTime;
        const timeSinceLastSSE = lastSSETime ? receiveTime - lastSSETime : 0;
        
        if (reading.messageNumber <= 15) { // Show first 15 messages
          console.log(`${reading.messageNumber.toString().padStart(7)}  | ${new Date(receiveTime).toLocaleTimeString()}.${(receiveTime % 1000).toString().padStart(3, '0')} | ${reading.currentMinute}:${reading.currentSecond.toString().padStart(2, '0')} (${reading.totalSeconds}s) | ${(timeSinceLastSSE/1000).toFixed(1)}s | ${networkDelay}ms`);
        }
        
        // Check for SSE message gaps
        if (lastSSETime && timeSinceLastSSE > 1500) { // More than 1.5s gap
          console.log(`🚨 SSE GAP: ${(timeSinceLastSSE/1000).toFixed(1)}s between messages!`);
        }
        
        // Check for timer value jumps in SSE
        if (sseReadings.length > 1) {
          const prevReading = sseReadings[sseReadings.length - 2];
          const secondsJump = reading.totalSeconds - prevReading.totalSeconds;
          const realTimeGap = (reading.timestamp - prevReading.timestamp) / 1000;
          
          if (secondsJump > realTimeGap + 1) {
            console.log(`🚨 SSE TIMER JUMP: ${secondsJump} seconds in ${realTimeGap.toFixed(1)}s real time!`);
          }
        }
        
        lastSSETime = receiveTime;
      }
    } catch (parseError) {
      console.log(`❌ Failed to parse SSE data: ${event.data}`);
    }
  };
  
  eventSource.onerror = function(error) {
    console.log('❌ SSE Error:', error.message || 'Connection failed');
  };
  
  // Stop SSE analysis after 15 seconds
  setTimeout(() => {
    eventSource.close();
    
    console.log('\n📈 SSE ANALYSIS RESULTS:');
    
    // Analyze SSE message timing
    let sseJumpCount = 0;
    let maxSSEJump = 0;
    let totalGaps = 0;
    
    for (let i = 1; i < sseReadings.length; i++) {
      const prev = sseReadings[i-1];
      const curr = sseReadings[i];
      const realGap = (curr.timestamp - prev.timestamp) / 1000;
      const timerJump = curr.totalSeconds - prev.totalSeconds;
      
      totalGaps += realGap;
      
      if (timerJump > realGap + 0.5) {
        sseJumpCount++;
        maxSSEJump = Math.max(maxSSEJump, timerJump - realGap);
      }
    }
    
    const avgGap = sseReadings.length > 1 ? totalGaps / (sseReadings.length - 1) : 0;
    
    console.log(`📊 SSE messages received: ${sseReadings.length}`);
    console.log(`📊 Average time between messages: ${avgGap.toFixed(1)}s`);
    console.log(`📊 SSE timer jumps detected: ${sseJumpCount}`);
    console.log(`📊 Maximum SSE jump: ${maxSSEJump.toFixed(1)} seconds`);
    
    // Phase 3: Frontend Simulation
    startFrontendSimulation(sseReadings);
    
  }, 15000);
}

function startFrontendSimulation(sseReadings) {
  console.log('\n🚀 PHASE 3: FRONTEND INTERPOLATION SIMULATION');
  console.log('=============================================');
  
  if (sseReadings.length === 0) {
    console.log('❌ No SSE data received, cannot simulate frontend');
    return;
  }
  
  console.log('🧮 Simulating React Native useMatchTimer interpolation logic...');
  
  // Simulate the frontend interpolation logic exactly as implemented
  let simulatedSeconds = 0;
  let lastSyncTime = Date.now();
  const frontendReadings = [];
  
  console.log('\n⏱️ FRONTEND TIMER SIMULATION:');
  console.log('Step | Server Sync | Frontend Shows | Expected | Gap | Issue');
  console.log('-----|-------------|----------------|----------|-----|------');
  
  sseReadings.forEach((sseReading, index) => {
    // This simulates what happens when frontend receives SSE update
    const networkLatency = (Date.now() - lastSyncTime) / 1000;
    const latencyCompensation = Math.min(networkLatency, 2);
    
    // This is the exact logic from our useMatchTimer
    simulatedSeconds = Math.floor(sseReading.totalSeconds + latencyCompensation);
    
    const expectedSeconds = Math.floor((Date.now() - (Date.now() - index * 1000)) / 1000);
    const gap = Math.abs(simulatedSeconds - expectedSeconds);
    
    const reading = {
      step: index + 1,
      serverSync: `${sseReading.currentMinute}:${sseReading.currentSecond.toString().padStart(2, '0')}`,
      frontendShows: `${Math.floor(simulatedSeconds/60)}:${(simulatedSeconds%60).toString().padStart(2, '0')}`,
      expected: `${Math.floor(expectedSeconds/60)}:${(expectedSeconds%60).toString().padStart(2, '0')}`,
      gap: gap.toFixed(1),
      issue: gap > 1 ? '🚨 JUMP' : '✅ OK'
    };
    
    frontendReadings.push(reading);
    
    if (index < 10) {
      console.log(`${reading.step.toString().padStart(3)}  | ${reading.serverSync.padStart(9)} | ${reading.frontendShows.padStart(12)} | ${reading.expected.padStart(6)} | ${reading.gap}s | ${reading.issue}`);
    }
  });
  
  // Final analysis
  setTimeout(() => {
    console.log('\n🎯 COMPREHENSIVE ROOT CAUSE ANALYSIS');
    console.log('====================================');
    
    const jumpingFrontendReadings = frontendReadings.filter(r => parseFloat(r.gap) > 1);
    
    console.log(`📊 Frontend timing issues: ${jumpingFrontendReadings.length}/${frontendReadings.length}`);
    
    if (jumpingFrontendReadings.length > 0) {
      console.log('\n🚨 ROOT CAUSE IDENTIFIED:');
      console.log('The issue is in the FRONTEND INTERPOLATION LOGIC:');
      console.log('1. Network latency compensation is causing overcorrection');
      console.log('2. Math.floor + latency compensation creates jumps');
      console.log('3. SSE message timing irregularities compound the problem');
      
      console.log('\n🔧 REQUIRED FIXES:');
      console.log('1. Remove or limit latency compensation');
      console.log('2. Use server timestamp as authoritative source');
      console.log('3. Implement smoother interpolation algorithm');
      console.log('4. Add bounds checking to prevent large jumps');
    } else {
      console.log('\n⚠️ NEED DEEPER INVESTIGATION:');
      console.log('The simulated logic appears correct');
      console.log('The issue might be in:');
      console.log('1. React Native setInterval inconsistencies');
      console.log('2. JavaScript engine timing variations');
      console.log('3. Memory pressure affecting timer precision');
      console.log('4. Component re-render timing issues');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 NEXT STEPS: Fix the identified issues and retest');
    
  }, 1000);
}

console.log('Starting deep timer investigation...\n');
deepTimerInvestigation();