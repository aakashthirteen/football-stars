import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import teamRoutes from './routes/teams';
import matchRoutes from './routes/matches';
import statsRoutes from './routes/stats';
import playerRoutes from './routes/players';
import tournamentRoutes from './routes/tournaments';
import uploadRoutes from './routes/upload';
import simpleMatchRoutes from './routes/simpleMatches';

// Import database
import { database } from './models/databaseFactory';
import { PostgresDatabase } from './models/postgresDatabase';

// Load environment variables
dotenv.config();

const app = express();

// Database will initialize automatically on creation
console.log('🗄️ PostgreSQL database initialization started');

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Database test endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const db = database as PostgresDatabase;
    const result = await db.pool.query('SELECT COUNT(*) FROM users');
    res.json({ 
      success: true, 
      userCount: result.rows[0].count,
      message: 'Database connected successfully'
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Database connection failed'
    });
  }
});

// Clean up test data endpoint
app.post('/api/cleanup-test-data', async (req, res) => {
  try {
    const db = database as PostgresDatabase;
    
    // Delete all match events
    await db.pool.query('DELETE FROM match_events');
    
    // Reset match scores
    await db.pool.query('UPDATE matches SET home_score = 0, away_score = 0');
    
    console.log('🧹 Test data cleaned up successfully');
    
    res.json({
      success: true,
      message: 'Test data cleaned up successfully'
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Cleanup failed'
    });
  }
});

// Database inspection endpoint for match events
app.get('/api/inspect-events', async (req, res) => {
  try {
    const db = database as PostgresDatabase;
    
    // 1. Get total count of match events
    const totalCount = await db.pool.query('SELECT COUNT(*) as total FROM match_events');
    
    // 2. Get count of unique events (by match_id, player_id, event_type, minute)
    const uniqueCount = await db.pool.query(`
      SELECT COUNT(DISTINCT (match_id, player_id, event_type, minute)) as unique_events 
      FROM match_events
    `);
    
    // 3. Find exact duplicates
    const duplicates = await db.pool.query(`
      SELECT match_id, player_id, event_type, minute, COUNT(*) as duplicate_count,
             STRING_AGG(id::text, ', ') as event_ids,
             MIN(created_at) as first_created,
             MAX(created_at) as last_created
      FROM match_events 
      GROUP BY match_id, player_id, event_type, minute 
      HAVING COUNT(*) > 1
      ORDER BY duplicate_count DESC, last_created DESC
      LIMIT 10
    `);
    
    // 4. Get recent events for inspection
    const recentEvents = await db.pool.query(`
      SELECT me.id, me.match_id, me.player_id, me.event_type, me.minute, me.created_at,
             p.name as player_name
      FROM match_events me
      LEFT JOIN players p ON me.player_id = p.id
      ORDER BY me.created_at DESC
      LIMIT 20
    `);
    
    // 5. Check player statistics
    const playerStats = await db.pool.query(`
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
    
    // 6. Check for rapid-fire events (same player, same minute, within seconds)
    const rapidFire = await db.pool.query(`
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
    
    const duplicateEventCount = parseInt(totalCount.rows[0].total) - parseInt(uniqueCount.rows[0].unique_events);
    
    res.json({
      summary: {
        totalEvents: parseInt(totalCount.rows[0].total),
        uniqueEvents: parseInt(uniqueCount.rows[0].unique_events),
        duplicateEvents: duplicateEventCount,
        hasDuplicates: duplicateEventCount > 0
      },
      duplicates: duplicates.rows,
      recentEvents: recentEvents.rows,
      playerStats: playerStats.rows,
      rapidFireEvents: rapidFire.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Database inspection failed'
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/simple-matches', simpleMatchRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;