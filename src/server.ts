import app from './app';
import { database } from './models/databaseFactory';

const PORT = parseInt(process.env.PORT || '3001', 10);

// Force database initialization before starting server
async function startServer() {
  try {
    console.log('🔄 Checking database tables...');
    
    // Force table creation for formations
    if (database && database.pool) {
      const client = await database.pool.connect();
      
      try {
        // Check if formations table exists
        const tableCheck = await client.query(`
          SELECT table_name FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'match_formations'
        `);
        
        if (tableCheck.rows.length === 0) {
          console.log('⚠️ match_formations table not found, creating it now...');
          
          await client.query(`
            CREATE TABLE IF NOT EXISTS match_formations (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
              team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
              formation VARCHAR(20) NOT NULL,
              game_format VARCHAR(10) CHECK (game_format IN ('5v5', '7v7', '11v11')) DEFAULT '11v11',
              formation_data JSONB NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(match_id, team_id)
            )
          `);
          
          console.log('✅ match_formations table created successfully');
        } else {
          console.log('✅ match_formations table already exists');
        }

        // Check and add SSE timer columns
        console.log('🔄 Checking SSE timer columns...');
        const timerColumnsCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'matches' 
          AND column_name = 'timer_started_at'
        `);

        if (timerColumnsCheck.rows.length === 0) {
          console.log('⚠️ SSE timer columns not found, adding them now...');
          
          // Add timer tracking columns
          await client.query(`
            ALTER TABLE matches 
            ADD COLUMN IF NOT EXISTS timer_started_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS halftime_started_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS second_half_started_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS timer_paused_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS total_paused_duration INTEGER DEFAULT 0
          `);
          
          console.log('✅ Added SSE timer tracking columns');
          
          // Add index for performance
          await client.query(`
            CREATE INDEX IF NOT EXISTS idx_matches_timer_status 
            ON matches(status, timer_started_at)
          `);
          
          console.log('✅ Added timer status index');
          
          // Update existing LIVE matches
          const updateResult = await client.query(`
            UPDATE matches 
            SET timer_started_at = match_date 
            WHERE status = 'LIVE' 
            AND timer_started_at IS NULL
          `);
          
          console.log(`✅ Updated ${updateResult.rowCount} live matches with timer start time`);
        } else {
          console.log('✅ SSE timer columns already exist');
        }
      } finally {
        client.release();
      }
    }
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Railway URL: ${process.env.RAILWAY_STATIC_URL || 'Not in Railway'}`);
      console.log(`📱 Health check: http://localhost:${PORT}/health`);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`📱 Local access: http://localhost:${PORT}/health`);
      }
    });

    // SSE timer service is initialized automatically when matches start
    console.log('✅ Server started successfully! SSE timer service ready.');

    // Graceful shutdown handlers
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
      });
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();