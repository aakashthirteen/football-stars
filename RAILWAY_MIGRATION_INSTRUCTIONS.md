# Railway Database Migration Instructions

## ⚠️ URGENT: Run This Migration on Railway Database

The SSE timer system requires new database columns that don't exist in production yet.

## Option 1: Using Railway Dashboard (Recommended)

1. **Go to Railway Dashboard**
   - Visit https://railway.app
   - Open your football-stars project
   - Click on your PostgreSQL database service

2. **Open Database Console**
   - Click on "Data" tab
   - Click "Query" to open SQL console

3. **Run Migration SQL**
   - Copy the contents of `railway-migration.sql`
   - Paste into the query console
   - Click "Run"

## Option 2: Using Railway CLI

```bash
# Install Railway CLI if you haven't
npm install -g @railway/cli

# Login to Railway
railway login

# Connect to your database
railway connect

# Run the migration
\i railway-migration.sql
```

## Option 3: Using Database URL

If you have the DATABASE_URL from Railway:

```bash
# Connect using psql
psql "your-railway-database-url-here"

# Run the migration
\i railway-migration.sql
```

## ✅ Verification

After running the migration, you should see output like:
```
ALTER TABLE
CREATE INDEX
UPDATE 0
ALTER TABLE
ALTER TABLE

      column_name      
-----------------------
 timer_started_at
 halftime_started_at
 second_half_started_at
 timer_paused_at
 total_paused_duration
(5 rows)
```

## 🚀 After Migration

Once the migration is complete:
1. Your SSE timer system will work properly
2. Match start will succeed without errors
3. Timer tracking will be reliable

## 🆘 If You Need Help

The migration adds these columns to the matches table:
- `timer_started_at` - When timer started
- `halftime_started_at` - When halftime began
- `second_half_started_at` - When second half started  
- `timer_paused_at` - When timer was paused
- `total_paused_duration` - Total paused time in seconds

These are required for the SSE timer system to track match timing properly.