# 27 Circle App

A Next.js app for university students to join small group conversations ("Circles") on campus.

## Current Status: MVP Mode

**Matching Algorithm**: Currently using simplified MVP approach where all users join one massive circle with no demographic matching.

**Original Algorithm**: Backed up in `backup/matching-algorithm/` - see `RESTORE_INSTRUCTIONS.md` for details on restoring the age+gender bucketing algorithm when ready for advanced features.

## Quick Start

```bash
npm install
npm run dev
```

## Key Features

- **Time Slots**: 11AM, 2PM, 5PM daily
- **Waitlist System**: Join/leave before deadlines
- **Simple Matching**: All users go to same circle (MVP)
- **Location Assignment**: Single GPS coordinate for all
- **Conversation Sparks**: Single topic for all groups

## Development

- **Time Management**: Use `APP_TIME_OFFSET` in `src/lib/constants.ts` for testing
- **Database**: Supabase with Row Level Security
- **Authentication**: Supabase Auth with phone/SMS
- **Styling**: Tailwind CSS

## Testing

```bash
# Run comprehensive tests
node scripts/run-all-tests.js

# Test matching manually
node scripts/trigger-matching.js
```
