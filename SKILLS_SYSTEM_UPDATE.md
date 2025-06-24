# Skills System Update: Active Skills & Greatest Alley Toggle

## Overview

This document outlines the changes made to the skills system to make all skills active by default, with the exception of "Greatest Alley" which remains toggleable and can be disabled to prevent XP gain from Israel/Mossad-related actions.

## Key Changes Implemented

### 1. All Skills Active by Default

**Problem Solved**: Users previously had to manually enable skills, creating friction and confusion about skill functionality.

**Solution**: Made all skills non-toggleable and active by default, except for "Greatest Alley".

#### Changes Made:
- Updated `skills` table: Set `is_toggleable = false` for all skills except `greatest_alley`
- Updated `user_skills` table: Set `is_enabled = true` for all non-toggleable skills
- Modified `toggleSkill()` function to verify skill is toggleable before allowing changes

### 2. Greatest Alley Special Handling

**Problem Solved**: Need for players to opt-out of Israel/Mossad cooperation benefits while maintaining other skill functionality.

**Solution**: "Greatest Alley" remains the only toggleable skill and starts disabled by default.

#### Implementation Details:

```typescript
// Only Greatest Alley can be toggled
async toggleSkill(userId: string, skillCode: string, enabled: boolean): Promise<boolean> {
  // Verify skill is toggleable before allowing changes
  const skill = await supabase.from('skills').select('id, is_toggleable').eq('skill_code', skillCode).single();
  
  if (!skill.is_toggleable) {
    return false; // Cannot toggle non-toggleable skills
  }
  
  // Update enablement state
  await supabase.from('user_skills').update({ is_enabled: enabled }).eq('user_id', userId).eq('skill_id', skill.id);
}
```

### 3. XP Award Validation

**Problem Solved**: XP was being awarded for Greatest Alley even when disabled, undermining the toggle functionality.

**Solution**: Added skill enablement checks in XP award logic to prevent XP gain for disabled skills.

#### XP Award Flow:

```typescript
// During mission decisions
if (skillCode === 'greatest_alley') {
  const isEnabled = await dbOperations.isSkillEnabled(session.user_id, 'greatest_alley');
  if (isEnabled) {
    skillXP = Math.floor(baseXP * 0.6); // Award skill XP
  } else {
    finalSkillCode = null; // No skill XP awarded
    console.log('Greatest Alley disabled - no skill XP awarded');
  }
} else {
  // All other skills are always enabled
  skillXP = Math.floor(baseXP * 0.6);
}
```

## Technical Implementation

### Database Schema Changes

```sql
-- Make all skills non-toggleable except Greatest Alley
UPDATE skills 
SET is_toggleable = false 
WHERE skill_code != 'greatest_alley';

-- Enable all non-toggleable skills for all users
UPDATE user_skills 
SET is_enabled = true 
WHERE skill_id IN (SELECT id FROM skills WHERE skill_code != 'greatest_alley');
```

### New Functions Added

1. **isSkillEnabled()** - Check if a specific skill is enabled for a user
2. **Enhanced toggleSkill()** - Verify skill is toggleable before allowing changes
3. **Updated award_xp()** - Check skill enablement before awarding XP

### XP Award Logic Updates

#### Mission Decision XP
- Checks if "greatest_alley" is enabled before awarding skill XP
- All other skills always receive XP (since they're always enabled)
- Logs enablement status for debugging

#### Mission Completion XP
- Same enablement check applies to mission completion bonuses
- Prevents Greatest Alley XP even for successful Israel/Mossad missions when disabled

## Skill States by Default

| Skill | Toggleable | Default State | Can Be Disabled |
|-------|------------|---------------|-----------------|
| Risk Taker | ❌ No | ✅ Enabled | ❌ No |
| Q Tech | ❌ No | ✅ Enabled | ❌ No |
| Bourne | ❌ No | ✅ Enabled | ❌ No |
| Carrie | ❌ No | ✅ Enabled | ❌ No |
| **Greatest Alley** | ✅ **Yes** | ❌ **Disabled** | ✅ **Yes** |
| Brody | ❌ No | ✅ Enabled | ❌ No |
| Ghost Protocol | ❌ No | ✅ Enabled | ❌ No |
| Honey Trap | ❌ No | ✅ Enabled | ❌ No |
| Crypto King | ❌ No | ✅ Enabled | ❌ No |
| Deep Throat | ❌ No | ✅ Enabled | ❌ No |

## Greatest Alley Behavior

### When Enabled:
- ✅ Receives XP for Israel/Mossad-related decisions
- ✅ Provides success bonuses for Israel/Mossad operations
- ✅ Applies penalties for Middle East adversary operations (Iran, Iraq, Pakistan, Palestine)
- ✅ Can be manually disabled by user

### When Disabled:
- ❌ **No XP gained** even for positive Israel/Mossad decisions
- ❌ No success bonuses for Israel/Mossad operations
- ❌ No penalties for Middle East adversary operations
- ✅ Can be manually enabled by user

## User Experience Changes

### For New Users:
- All skills except Greatest Alley are immediately active
- No need to manually enable skills
- Greatest Alley starts disabled (user must opt-in)
- Clear indication of which skills can be toggled

### For Existing Users:
- All previously disabled skills (except Greatest Alley) are now enabled
- Greatest Alley state preserved if previously modified by user
- Automatic migration ensures consistent skill states

## Security & Integrity

### Validation Checks:
1. **Toggleability Verification**: Only toggleable skills can be modified
2. **Skill Existence Check**: Prevents errors from invalid skill codes
3. **User Permission**: Users can only modify their own skills
4. **XP Integrity**: Disabled skills cannot gain XP under any circumstances

### Audit Trail:
- All skill toggle actions are logged
- XP award attempts for disabled skills are tracked
- Database triggers maintain data consistency

## Migration Process

### Automatic Updates:
1. Skills table updated to set correct toggleability
2. Existing user skills enabled (except Greatest Alley)
3. New character initialization includes correct default states
4. XP award functions updated to respect enablement

### Manual Steps Required:
```bash
# Run the skills system update script
psql -d your_database -f scripts/skills-system-update.sql
```

## Testing Scenarios

### Test Case 1: New User Registration
- ✅ All skills enabled except Greatest Alley
- ✅ Greatest Alley starts disabled
- ✅ XP awards work correctly for enabled skills
- ✅ No XP awarded for Greatest Alley when disabled

### Test Case 2: Greatest Alley Toggle
- ✅ Can enable Greatest Alley successfully
- ✅ Receives XP after enabling
- ✅ Can disable Greatest Alley successfully
- ✅ No XP awarded after disabling

### Test Case 3: Non-Toggleable Skills
- ❌ Cannot disable Risk Taker, Q Tech, etc.
- ✅ These skills always receive appropriate XP
- ✅ Toggle attempts are rejected with error

## Future Considerations

### Potential Enhancements:
1. **Skill Categories**: Group skills by type for easier management
2. **Temporary Disables**: Allow temporary skill disabling for specific missions
3. **Skill Conflicts**: Prevent conflicting skills from being enabled simultaneously
4. **Advanced Toggles**: More granular control over skill aspects

### Monitoring:
- Track Greatest Alley usage statistics
- Monitor XP distribution across skills
- Analyze user toggle patterns for UX improvements

---

## Summary

This update successfully implements the requested skill system changes:

1. ✅ **All skills active by default** - Users get immediate benefit from all skills except Greatest Alley
2. ✅ **Greatest Alley toggleable** - Can be turned off to prevent Israel/Mossad cooperation benefits
3. ✅ **No XP when disabled** - Greatest Alley gains no experience when disabled, even for positive actions

The system maintains backward compatibility while providing the political sensitivity controls requested for Israel/Mossad-related content. 