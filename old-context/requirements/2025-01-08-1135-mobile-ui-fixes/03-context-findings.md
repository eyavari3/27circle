# Context Findings: Mobile UI Fixes

**Phase:** Context Analysis  
**Updated:** 2025-01-08 11:35

## Current Implementation Analysis

### Files That Need Modification:
1. **src/components/onboarding/SplashScreen.tsx** - Splash animation timing and sequencing
2. **src/components/onboarding/WelcomeScreen.tsx** - Mobile layout and image sizing
3. **src/components/onboarding/CuriositySelector.tsx** - Mobile layout and touch interactions
4. **src/app/onboarding/curiosity-1/page.tsx** - Route correction (should be `/onboarding/curiosity-1`)
5. **src/app/onboarding/curiosity-2/page.tsx** - Route correction (should be `/onboarding/curiosity-2`)

### Current Issues Identified:

#### 1. SplashScreen Component:
- Currently uses 2s timeout, needs 3s total duration
- Has inline JSX styles (violates Tailwind-only requirement)
- Animation is basic fade-in, needs staggered logo/tagline timing
- Missing fade-to-white before redirect

#### 2. WelcomeScreen Component:
- Image uses `aspect-[4/3]` and `fill` which may cause mobile issues
- Layout is responsive but may need mobile-specific adjustments
- Missing fade-in animations for page elements

#### 3. CuriositySelector Component:
- Uses vertical stacking (space-y-8) instead of 2x2 grid layout  
- Current layout: `w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48`
- Mobile size (w-32 h-32 = 128px) may be too small for 390px width
- Glow effects defined in props but implementation complex
- Touch interactions should work but need verification

### Technical Constraints:
- Next.js 15.3.5 with App Router
- Tailwind CSS utility classes only
- Must maintain existing responsive breakpoints (sm:, lg:)
- No custom CSS in globals.css for animations
- Multi-select functionality must be preserved

### Patterns to Follow:
- Mobile-first responsive design (base classes for mobile, sm:/lg: for larger)
- Tailwind transition classes: `transition-all duration-300 ease-out`
- Image optimization with Next.js Image component
- State management with useState hooks
- Router navigation with useRouter

### Similar Features Analyzed:
- TimeSlotCard component shows good mobile-responsive button patterns
- Existing transition patterns use `transition-colors duration-200`
- Current glow implementation uses Tailwind `drop-shadow` utilities

### Integration Points:
- saveUserInterests action in `/app/onboarding/actions.ts`
- Navigation flow: `/` → `/welcome` → `/onboarding/profile` → `/onboarding/curiosity-1` → `/onboarding/curiosity-2` → `/circles`
- Image assets in `/public/images/onboarding/` and `/public/images/curiosity/`