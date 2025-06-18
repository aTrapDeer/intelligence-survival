# 🚀 XP System Fix Guide

Your XP system isn't working because your database is missing essential components. Follow these steps exactly:

## Step 1: Run the Database Repair Script

1. **Copy the entire contents** of `scripts/repair-database.sql`
2. **Go to your Supabase Dashboard** → Project → SQL Editor
3. **Create a new query** and paste the repair script
4. **Run the script** - this will:
   - Add missing columns to existing tables
   - Create missing tables (`skills`, `xp_gains`, `level_requirements`)
   - Create essential database functions
   - Create database views for efficient data access
   - Populate initial data (skills, level requirements)

## Step 2: Test Your Setup

After running the repair script, test using the debug endpoint:

```javascript
// In your browser console or API testing tool
fetch('/api/debug', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    userId: 'your-actual-user-id-here', // Get this from your auth
    action: 'all' 
  })
})
.then(r => r.json())
.then(console.log);
```

Replace `'your-actual-user-id-here'` with your actual user ID from authentication.

## Step 3: Check Your Browser Console

With the new debug logging, you should see:
- `🔧 Initializing character for user: [user-id]`
- `🎯 Awarding XP for user: [user-id]`
- `📊 Fetching character data for user: [user-id]`

## Step 4: Initialize Your Character

If you're still having issues, manually initialize your character:

1. Go to Supabase → SQL Editor
2. Run this query (replace with your user ID):

```sql
SELECT initialize_character('your-user-id-here');
```

## Step 5: Verify Database Entries

Check if data is being created by running these queries in Supabase SQL Editor:

```sql
-- Check character stats
SELECT * FROM character_stats WHERE user_id = 'your-user-id-here';

-- Check user skills
SELECT * FROM user_skills WHERE user_id = 'your-user-id-here';

-- Check XP gains
SELECT * FROM xp_gains WHERE user_id = 'your-user-id-here' ORDER BY created_at DESC;

-- Check mission sessions with user ID
SELECT * FROM mission_sessions WHERE user_id = 'your-user-id-here';
```

## Common Issues & Solutions

### Issue 1: "No XP earned from successful decisions"
**Likely cause:** Missing database functions
**Solution:** Run the repair script completely

### Issue 2: "Agent Levels shows nothing"
**Likely cause:** Missing views (`user_character_overview`, `user_skills_overview`)
**Solution:** Run the repair script - it creates these views

### Issue 3: "No rows in leveling databases"
**Likely cause:** Character not initialized or user ID not being passed
**Solution:** 
1. Check browser console for debug logs
2. Verify user authentication is working
3. Manually run `initialize_character()` function

### Issue 4: Database function errors
**Error:** `function award_xp(uuid, uuid, integer, ...) does not exist`
**Solution:** The repair script didn't run completely. Re-run it.

## Debug Checklist

✅ Database repair script executed successfully  
✅ All 10 skills appear in `skills` table  
✅ Level requirements populated (100 levels)  
✅ User authentication working (user ID available)  
✅ Character initialized (entries in `character_stats` and `user_skills`)  
✅ Debug logs appear in browser console  
✅ XP gains logged in `xp_gains` table  

## Expected Behavior After Fix

1. **Mission Start:** Character auto-initialized, you see initialization logs
2. **Each Decision:** 10-25 XP awarded, you see `⚡ +15 Base XP | +9 Risk Taker XP` messages
3. **Agent Levels:** Shows your character stats, level progress bars, skills list
4. **Mission Complete:** Bonus XP (15-150) based on outcome A/B/C/D
5. **Database:** New rows in `character_stats`, `user_skills`, `xp_gains` tables

## Still Having Issues?

1. **Check browser console** for specific error messages
2. **Run the debug endpoint** to test each component
3. **Verify your user ID** is being passed correctly
4. **Check Supabase logs** for database errors

The most common issue is the database repair script not running completely or user authentication not working properly. 