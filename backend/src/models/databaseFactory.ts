import { SQLiteDatabase } from './sqliteDatabase';
import { PostgresDatabase } from './postgresDatabase';

// Database factory to switch between SQLite (local) and PostgreSQL (production)
export function createDatabase() {
  const usePostgres = process.env.DATABASE_URL || process.env.NODE_ENV === 'production';
  
  if (usePostgres) {
    console.log('🐘 Using PostgreSQL database (Production)');
    return new PostgresDatabase();
  } else {
    console.log('🗃️ Using SQLite database (Development)');
    return new SQLiteDatabase();
  }
}

// Export a singleton instance
export const database = createDatabase();