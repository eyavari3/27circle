# Restore Original Matching Algorithm

## Files Backed Up
- `algorithm.ts` - Original age+gender bucketing algorithm
- `matching-route.ts` - Original cron API endpoint

## To Restore (When Ready for Advanced Matching)

1. **Restore the algorithm:**
   ```bash
   cp backup/matching-algorithm/algorithm.ts src/lib/matching/algorithm.ts
   ```

2. **Restore the API route:**
   ```bash
   cp backup/matching-algorithm/matching-route.ts src/app/api/cron/matching/route.ts
   ```

3. **Test the restoration:**
   ```bash
   # Test with the trigger script
   node scripts/trigger-matching.js
   ```

## What the Original Algorithm Did
- **Age+Gender Bucketing**: Groups users by age (18-25 vs 26+) and gender
- **Optimal Group Sizing**: Creates groups of 4, then 3, then 2
- **Demographic Balance**: Ensures diversity within groups
- **Random Assignment**: Within each bucket, users are randomly assigned

## Current MVP Approach
- **Single Circle**: All users go to one massive circle
- **No Matching**: No age/gender/interest consideration
- **Same Location**: Everyone gets the same GPS coordinates
- **Same Spark**: Everyone gets the same conversation starter

## When to Restore
- After MVP validation
- When user base grows beyond single-circle capacity
- When demographic balance becomes important
- When interest-based matching is needed 