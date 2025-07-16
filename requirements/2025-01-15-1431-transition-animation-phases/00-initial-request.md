# Initial Request

## User Request
Implement Phases 2 & 3 of the 3-phase animation system using the existing TransitionContainer architecture.

## Current State Analysis
- **Phase 1**: Splash animation (~2.8s) + (2s) pause = 4.8s ✅ COMPLETE
- **Phase 2**: Transition (0.5s) ❌ NEEDS MODIFICATION  
- **Phase 3**: Curiosity appearance ❌ NEEDS MODIFICATION

## Requirements Summary
**Phase 2: The Interactive Transition**
- User control and responsiveness after Phase 1 completes
- Interactive reading window (1-2 seconds maximum)
- Invisible overlay listening for user tap
- If user taps: transition begins immediately
- If no tap: timer triggers automatically
- Swift ~1.2-second transition event:
  - Splash text fades
  - Logo glows and collapses into a point
  - Dark blue background cross-fades to white

**Phase 3: Curiosity 1 Appearance**
- Clean and generative feel
- Background cross-fade completion
- Synchronized cascade of content materialization:
  - "What sparks your curiosity?" title
  - Underline
  - Two brain illustrations
  - "Next" button and "Step 1 of 2" indicator
- Quick, gentle fade and upward slide animations
- Results in fully loaded, static, ready-for-interaction screen

## Technical Constraints
- Must work within existing TransitionContainer architecture
- Current timing: Phase 1 (4.8s) + Phase 2 (0.5s) = 5.3s total
- Phase 2 & 3 timing modifications are at implementer's discretion

## Files Involved
- `/src/components/onboarding/TransitionContainer.tsx` (main orchestration)
- `/src/components/onboarding/SplashScreen.tsx` (Phase 1 complete)
- `/src/components/onboarding/CuriosityPageWrapper.tsx` (Phase 3 target)
- `/src/components/onboarding/InterestSelection.tsx` (Phase 3 content)
- `/src/app/globals.css` (animations)

## Success Criteria
- Smooth, premium feeling transition sequence
- User can tap to skip reading window
- All animations feel synchronized and purposeful
- No janky or broken states during transitions
- Mobile-responsive and accessible