# Discovery Questions: Mobile UI Fixes

**Phase:** Discovery Questions
**Created:** 2025-01-08 11:35

## Q1: Should the splash screen animation timing be exactly as specified (logo at 1s, tagline at 1.5s, total 4s duration)?
**Default if unknown:** Yes (user provided specific timing requirements that suggest UX testing has been done)

## Q2: Should the mobile fixes maintain the existing desktop responsive breakpoints (sm:, lg:)?
**Default if unknown:** Yes (requirement states "Desktop should remain functional (not broken)")

## Q3: Do the curiosity selection pages need to support multi-select behavior on mobile?
**Default if unknown:** Yes (existing CuriositySelector component supports multi-select, should maintain consistency)

## Q4: Should the glow effects on curiosity pages work with touch interactions on mobile devices?
**Default if unknown:** Yes (mobile-first approach requires touch-friendly interactions)

## Q5: Should the animations use CSS transitions in globals.css rather than inline styles?
**Default if unknown:** Yes (requirement specifically states "Use Tailwind CSS classes only (no inline styles)" and mentions globals.css for animations)