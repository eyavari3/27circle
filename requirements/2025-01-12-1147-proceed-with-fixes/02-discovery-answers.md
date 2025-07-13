# Discovery Answers

## Q1: Should we prioritize fixing the image path issues first before any other work?
**Answer:** Yes - broken images are blocking the splash screen and onboarding flow. Can't test anything if the app won't load.

## Q2: Do you want to implement the authentication pages from auth-guide.md as part of this work?
**Answer:** Yes - but only after fixing images and Tailwind CSS. Authentication is essential for the 27-hour circle mechanic.

## Q3: Should we reorganize all images to follow the correct /public/images/ structure as defined in CLAUDE.md?
**Answer:** No - let's create an optimized structure instead. Keep the existing logical organization:
- /public/Images/Other/Pages/ - for page-specific images
- /public/Images/PNG/ - for reusable assets

Instead of reorganizing everything, just update the component paths to match the existing structure. This is faster and the current structure actually makes more sense than dumping everything in /public/images/.

## Q4: Do you need the UI to match the mockups pixel-perfectly before considering it complete?
**Answer:** Yes - this is a divine project for Stanford students. But fix functionality first (images, Tailwind), then perfect the pixels.

## Q5: Should we address all 10 pitfalls from pitfall.md during this implementation phase?
**Answer:** No - fix blocking issues first. Once the app works end-to-end, then do a comprehensive pitfalls review. Trying to be perfect while things are broken is premature optimization.

## Priority Order
1. Images → 2. Tailwind → 3. Auth Flow → 4. Pixel Perfect → 5. Pitfalls