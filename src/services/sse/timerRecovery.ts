import { database } from '../../models/databaseFactory';
import { sseMatchTimerService } from './SSEMatchTimerService';

/**
 * Recovers active match timers on server startup
 */
export async function recoverActiveTimers(): Promise<void> {
  try {
    console.log('🔄 Timer Recovery: Starting timer recovery process...');
    
    // Query for all matches that should have active timers
    const activeMatches = await database.pool.query(`
      SELECT id, status, timer_started_at, timer_paused_at, 
             halftime_started_at, second_half_started_at
      FROM matches 
      WHERE status IN ('LIVE', 'HALFTIME')
      AND timer_started_at IS NOT NULL
    `);
    
    if (activeMatches.rows.length === 0) {
      console.log('✅ Timer Recovery: No active matches to recover');
      return;
    }
    
    console.log(`🔄 Timer Recovery: Found ${activeMatches.rows.length} active matches to recover`);
    
    // Initialize each match timer
    for (const match of activeMatches.rows) {
      try {
        console.log(`🔄 Timer Recovery: Recovering match ${match.id} (status: ${match.status})`);
        
        // Use the SSE service's initialization method
        await sseMatchTimerService.initializeFromDatabase(match.id);
        
        console.log(`✅ Timer Recovery: Successfully recovered match ${match.id}`);
      } catch (error) {
        console.error(`❌ Timer Recovery: Failed to recover match ${match.id}:`, error);
      }
    }
    
    console.log('✅ Timer Recovery: Recovery process completed');
    
  } catch (error) {
    console.error('❌ Timer Recovery: Fatal error during recovery:', error);
  }
}

/**
 * Cleans up stale match timers (matches that should have ended)
 */
export async function cleanupStaleTimers(): Promise<void> {
  try {
    console.log('🧹 Timer Cleanup: Starting cleanup process...');
    
    // Find matches that should have ended (started more than duration + 30 min ago)
    const staleMatches = await database.pool.query(`
      UPDATE matches 
      SET status = 'COMPLETED'
      WHERE status IN ('LIVE', 'HALFTIME')
      AND timer_started_at IS NOT NULL
      AND timer_started_at < NOW() - INTERVAL '150 minutes'
      RETURNING id
    `);
    
    if (staleMatches.rows.length > 0) {
      console.log(`🧹 Timer Cleanup: Marked ${staleMatches.rows.length} stale matches as completed`);
    } else {
      console.log('✅ Timer Cleanup: No stale matches found');
    }
    
  } catch (error) {
    console.error('❌ Timer Cleanup: Error during cleanup:', error);
  }
}