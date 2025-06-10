import { PostgresDatabase } from './postgresDatabase';

// Simple PostgreSQL-only database configuration
export function createDatabase() {
  console.log('🐘 Using PostgreSQL database');
  return new PostgresDatabase();
}

// Export a singleton instance
export const database = createDatabase();