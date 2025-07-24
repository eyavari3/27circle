# Discovery Answers: Mobile UI Fixes

**Phase:** Discovery Answers  
**Updated:** 2025-01-08 11:35

## Q1: Should the splash screen animation timing be exactly as specified (logo at 1s, tagline at 1.5s, total 4s duration)?
**Answer:** Yes, the total duration should be 3 seconds, before automatically redirecting to /welcome. The animation should feel smooth and professional.

## Q2: Should the mobile fixes maintain the existing desktop responsive breakpoints (sm:, lg:)?
**Answer:** Yes. The goal is to make the mobile view perfect without breaking the existing desktop layout. Use mobile-first classes for the base styles and then use sm:, md:, lg: prefixes to adjust for larger screens as needed.

## Q3: Do the curiosity selection pages need to support multi-select behavior on mobile?
**Answer:** Yes, absolutely. The core functionality of selecting one or more interests must be identical on all devices. The InterestSelection component logic should already support this; the UI must simply present it correctly on mobile.

## Q4: Should the glow effects on curiosity pages work with touch interactions on mobile devices?
**Answer:** Yes. A tap on mobile should be equivalent to a click on desktop. The glow effect for a "selected" state must appear and persist after a user taps an image.

## Q5: Should the animations use CSS transitions in globals.css rather than inline styles?
**Answer:** No, this is a misunderstanding of the rule. Use Tailwind's built-in transition and animation utility classes directly in the JSX (e.g., transition-all, duration-300, ease-in-out). Do not add custom animations to globals.css unless it is absolutely impossible to achieve the effect with standard Tailwind utilities.