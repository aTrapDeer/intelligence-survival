-- Cleanup duplicate skills - keep original lowercase versions
-- This script removes the uppercase duplicates that were accidentally added

BEGIN;

-- First, remove any user_skills entries that reference the duplicate skill IDs
-- This prevents unique constraint violations and removes progress on duplicate skills
DELETE FROM public.user_skills 
WHERE skill_id IN (17, 18, 19, 20, 21, 22, 23, 24, 25, 26);

-- Now remove the duplicate skills from the skills table (keep the original lowercase ones)
DELETE FROM public.skills WHERE id IN (17, 18, 19, 20, 21, 22, 23, 24, 25, 26);

-- Verify cleanup - should only show original skills (no IDs 17-26)
SELECT skill_code, skill_name, id FROM public.skills ORDER BY id;

-- Show remaining user skills to verify no orphaned references
SELECT DISTINCT skill_id FROM public.user_skills ORDER BY skill_id;

COMMIT; 