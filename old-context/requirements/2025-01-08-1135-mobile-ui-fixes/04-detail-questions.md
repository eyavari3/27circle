# Detail Questions: Mobile UI Fixes

**Phase:** Expert Detail Questions  
**Created:** 2025-01-08 11:35

## Q6: Should the curiosity pages use a 2x2 grid layout on mobile instead of the current vertical stacking?
**Default if unknown:** Yes (mockup shows side-by-side brain images, current implementation uses vertical space-y-8 which wastes mobile screen space)

## Q7: Should the splash screen logo use the existing custom SVG or replace it with a simpler text-based approach for better animation control?
**Default if unknown:** Keep existing SVG (already implemented and working, just needs timing adjustments)

## Q8: Should the Welcome page image be constrained to a maximum height on mobile to prevent it from dominating the screen?
**Default if unknown:** Yes (mockup shows balanced proportions, current aspect-[4/3] with fill may be too large on tall mobile screens)

## Q9: Should the glow effects on curiosity pages use the existing drop-shadow implementation or switch to a box-shadow approach for better mobile performance?
**Default if unknown:** Keep drop-shadow (already implemented in component props, maintains consistency with existing patterns)

## Q10: Should the curiosity selection images be larger on mobile (390px width) to improve touch target accessibility?
**Default if unknown:** Yes (current w-32 h-32 = 128px may be too small for comfortable touch interaction on mobile)