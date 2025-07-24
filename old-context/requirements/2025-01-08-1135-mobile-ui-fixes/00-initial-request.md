# Initial Request: Mobile UI Fixes for Onboarding Flow

**Date:** 2025-01-08 11:35
**Status:** Active

## User Request

The onboarding UI is broken on mobile (390px width). Please fix these specific issues:

## Splash Screen Animation (route: `/`)
- Currently there is no Splash Screen implementation
- Requirements:
  - Deep blue background (#1e3a8a or similar to match mockup)
  - 27 Circle logo fades in over 1s
  - "Be Curious Together" tagline fades in at 1.5s
  - Total splash duration: 4s
  - Entire screen fades to white, then redirects to `/welcome`
  - Reference mockup: `/public/images/mockups/1-splash-screen.png`

## First Page Issues (route: `/welcome`)
- Currently the image covers the entire screen
- Should match mockup: `/public/images/mockups/2-first-page.png`
- Fix:
  - Image should be contained, not full screen
  - Add proper spacing and text hierarchy
  - "Meet 3 curious minds" as main heading
  - Descriptive text below
  - "Start my journey" button at bottom
  - Add smooth fade-in transitions for all elements
  - Image path: `/public/images/onboarding/Friends_Seated.png`

## Curiosity Pages (routes: `/curiosity-1`, `/curiosity-2`)
- Ensure proper mobile layout for the 2x2 grid of selections
- Fix image centering and sizing
- Add hover glow effects:
  - Blue glow: Deep Conversations, Spiritual Exploration
  - Orange/warm glow: New Activities, Community Service
- Maintain selection state with persistent glow

## Technical Requirements:
- Mobile-first approach: Perfect at 390px width
- Use Tailwind CSS classes only (no inline styles)
- Desktop should remain functional (not broken)
- Smooth transitions between all pages
- Use Next.js Image component for optimization

## Animation Guidelines:
- Use Tailwind animation classes or CSS animations in globals.css
- Fade effects: opacity transitions
- Consider using `animate-fade-in` custom animation if needed

Please update the existing components rather than creating new ones. Test all changes at 390px viewport width first, then verify desktop still works.