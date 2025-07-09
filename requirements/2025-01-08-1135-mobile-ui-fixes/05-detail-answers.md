# Detail Answers: Mobile UI Fixes

**Phase:** Expert Detail Answers  
**Updated:** 2025-01-08 11:35

## Q6: Should the curiosity pages use a 2x2 grid layout on mobile instead of the current vertical stacking?
**Answer:** Yes, a grid layout is correct. On mobile, the two curiosity images should be displayed side-by-side in a single row, exactly as shown in the mockups. Vertical stacking is incorrect.

## Q7: Should the splash screen logo use the existing custom SVG or replace it with a simpler text-based approach for better animation control?
**Answer:** No, replace the SVG. Use the new image file I have provided at /images/onboarding/27 Circle White Text.png. This PNG image is now the official logo for the splash screen.

## Q8: Should the Welcome page image be constrained to a maximum height on mobile to prevent it from dominating the screen?
**Answer:** Yes. The image on the Welcome page should not take up more than roughly 40% of the screen height on a typical mobile device. It should feel balanced, not oversized.

## Q9: Should the glow effects on curiosity pages use the existing drop-shadow implementation or switch to a box-shadow approach for better mobile performance?
**Answer:** Keep the filter: drop-shadow(...) implementation. It correctly traces the non-transparent parts of the PNG images (the brain and heart shapes), which box-shadow cannot do. Performance is secondary to achieving the correct visual effect here.

## Q10: Should the curiosity selection images be larger on mobile (390px width) to improve touch target accessibility?
**Answer:** Yes. The images are the primary interactive element on this screen and must be larger on mobile. They should each take up roughly 40-45% of the container's width to ensure they are easy and comfortable to tap.