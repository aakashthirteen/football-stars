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

// Import database
import { sqliteDb } from './models/sqliteDatabase';

// Load environment variables
dotenv.config();

const app = express();

// Initialize database
sqliteDb.initialize().then(() => {
  console.log('🗄️ Database initialized successfully');
}).catch(err => {
  console.error('❌ Database initialization failed:', err);
});

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

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/tournaments', tournamentRoutes);

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