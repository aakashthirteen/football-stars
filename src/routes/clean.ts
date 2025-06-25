import { Router, Request, Response } from 'express';
import { database } from '../models/databaseFactory';

const router = Router();

// Simple cleanup endpoint - no auth for convenience
router.get('/clean-old-matches', async (req: Request, res: Response) => {
  const client = await database.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Delete all matches before today
    const result = await client.query(`
      DELETE FROM matches 
      WHERE match_date < CURRENT_DATE
    `);
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: `Deleted ${result.rowCount} old matches`
    });
    
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

export default router;