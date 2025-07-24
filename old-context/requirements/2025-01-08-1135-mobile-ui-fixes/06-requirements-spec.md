# Requirements Specification: Mobile UI Fixes

**Project:** 27 Circle Mobile Onboarding Optimization  
**Created:** 2025-01-08 11:35  
**Status:** Ready for Implementation

## Problem Statement

The onboarding flow is broken on mobile devices (390px width) with several critical issues:
- Splash screen animation not following UX specifications
- Welcome page image dominating mobile screens  
- Curiosity pages using inefficient vertical layout instead of side-by-side grid
- Touch interactions not optimized for mobile devices

## Solution Overview

Optimize the existing onboarding components for mobile-first design while maintaining desktop functionality. Implement proper animation timing, balanced layouts, and touch-friendly interactions.

## Functional Requirements

### FR1: Splash Screen Animation (src/components/onboarding/SplashScreen.tsx)
- **FR1.1** Replace custom SVG logo with new PNG image at `/images/onboarding/27 Circle White Text.png`
- **FR1.2** Logo fades in over 1 second
- **FR1.3** "Be Curious Together" tagline fades in at 1.5 seconds  
- **FR1.4** Total splash duration of 3 seconds
- **FR1.5** Entire screen fades to white before redirecting to `/welcome`
- **FR1.6** Deep blue background (#1e3a8a) matching mockup

### FR2: Welcome Page Layout (src/components/onboarding/WelcomeScreen.tsx)
- **FR2.1** Image constrained to maximum 40% of screen height on mobile
- **FR2.2** Proper spacing and text hierarchy matching mockup
- **FR2.3** Smooth fade-in transitions for all page elements
- **FR2.4** Image remains contained, not full-screen
- **FR2.5** Maintain existing responsive breakpoints for desktop

### FR3: Curiosity Pages Grid Layout (src/components/onboarding/CuriositySelector.tsx)
- **FR3.1** Side-by-side grid layout instead of vertical stacking
- **FR3.2** Images sized at 40-45% of container width on mobile  
- **FR3.3** Touch-friendly interactions with persistent glow effects
- **FR3.4** Multi-select functionality preserved
- **FR3.5** Blue glow for Deep Conversations and New Activities
- **FR3.6** Orange/warm glow for Spiritual Exploration and Community Service

## Technical Requirements

### TR1: Mobile-First Implementation
- **TR1.1** Perfect rendering at 390px viewport width
- **TR1.2** Base Tailwind classes target mobile, responsive prefixes for larger screens
- **TR1.3** Desktop functionality must not be broken
- **TR1.4** Touch targets minimum 44px for accessibility

### TR2: Animation Implementation  
- **TR2.1** Use only Tailwind utility classes (transition-all, duration-300, ease-out)
- **TR2.2** No custom CSS in globals.css for animations
- **TR2.3** Staggered animation timing using JavaScript delays
- **TR2.4** Smooth fade effects using opacity transitions

### TR3: Performance Requirements
- **TR3.1** Use Next.js Image component for all images
- **TR3.2** Maintain existing drop-shadow implementation for glow effects
- **TR3.3** Preserve multi-select state management patterns
- **TR3.4** Keep existing router navigation flow

## Implementation Hints

### File: src/components/onboarding/SplashScreen.tsx
```jsx
// Replace timeout from 2000 to 3000ms
// Use new logo: /images/onboarding/27 Circle White Text.png  
// Implement staggered animations with opacity-0 initial state
// Add fade-to-white transition before redirect
```

### File: src/components/onboarding/WelcomeScreen.tsx
```jsx
// Change from aspect-[4/3] to max-h-[40vh] on mobile
// Add fade-in animations to text elements
// Use staggered delays for smooth entrance
```

### File: src/components/onboarding/CuriositySelector.tsx
```jsx
// Replace space-y-8 with grid grid-cols-2 gap-4
// Change image sizing from w-32 h-32 to w-[40%] aspect-square
// Ensure glow effects work with touch events
// Keep existing multi-select logic intact
```

## Patterns to Follow

### Responsive Design Pattern:
```jsx
className="text-lg sm:text-xl lg:text-2xl" // Mobile-first scaling
className="w-full max-w-sm sm:max-w-md lg:max-w-lg" // Container scaling  
```

### Animation Pattern:
```jsx
className="opacity-0 transition-all duration-300 ease-out" // Base
// + JavaScript to add opacity-100 with delays
```

### Touch Interaction Pattern:
```jsx
className="active:scale-95 transition-transform duration-150" // Touch feedback
```

## Acceptance Criteria

### AC1: Visual Verification
- [ ] Splash screen matches mockup timing and appearance
- [ ] Welcome page image is balanced on mobile (≤40% screen height)
- [ ] Curiosity pages show side-by-side layout on mobile
- [ ] All text is readable at 390px width

### AC2: Interaction Testing  
- [ ] Touch interactions work smoothly on mobile devices
- [ ] Glow effects appear and persist after selection
- [ ] Multi-select behavior functions identically on mobile and desktop
- [ ] Navigation flow completes successfully

### AC3: Responsive Verification
- [ ] Mobile (390px) renders perfectly
- [ ] Tablet breakpoints (768px) work correctly  
- [ ] Desktop (1024px+) maintains existing functionality
- [ ] No horizontal scrolling at any breakpoint

### AC4: Performance Validation
- [ ] All animations run at 60fps
- [ ] Image loading is optimized
- [ ] No console errors in browser dev tools
- [ ] Touch response feels immediate (<100ms)

## Assumptions

1. **Logo Asset:** New logo PNG at `/images/onboarding/27 Circle White Text.png` exists and is properly formatted
2. **Route Structure:** Existing route pattern `/onboarding/curiosity-1` and `/onboarding/curiosity-2` is correct
3. **State Management:** Current multi-select implementation in CuriositySelector is working correctly
4. **Navigation Flow:** Existing router.push() calls and page transitions are functioning
5. **Image Assets:** All referenced image files in `/public/images/` directory are accessible

## Dependencies

- Next.js Image component optimization
- Tailwind CSS utility classes  
- React hooks (useState, useEffect, useRouter)
- Existing saveUserInterests server action
- Touch event handling in modern mobile browsers

## Risk Mitigation

- **Animation Performance:** Test on lower-end mobile devices to ensure smooth playback
- **Image Loading:** Implement proper loading states and error handling
- **Touch Conflicts:** Verify no conflicts between touch events and hover states
- **Layout Reflow:** Test orientation changes and dynamic viewport sizing