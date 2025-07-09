## FEATURE:

Implement the complete, pixel-perfect UI/UX for the entire user onboarding flow. This involves styling all pages from the Splash Screen to the final Curiosity selection, ensuring they match the provided mockups exactly. This task is primarily focused on JSX structure and Tailwind CSS styling for existing, unstyled pages.

The flow consists of these screens:
1.  Splash Screen (Mockup 1)
2.  First Page (Mockup 2)
3.  Onboarding Profile (Mockup 5)
4.  Verification & Code Entry (Mockup 6)
5.  Curiosity 1 & 2 (Mockups 3 & 4)

## EXAMPLES:

1.  **Component Refactoring & Pattern:** The existing `src/components/onboarding/InterestSelection.tsx` component MUST be refactored as part of this task. It must be updated to use a Server Action located at `src/app/onboarding/actions.ts`, following the exact plan we previously defined. This newly refactored component will then serve as the pattern for client components that call server actions.
2.  **Styling Rules:** All styling must adhere to the Tailwind CSS rules defined in `CLAUDE.md`.

## DOCUMENTATION:

1.  **Visual Source of Truth:** The mockup images (1-Splash Screen.png, 2-First Page.png, etc.) are the absolute source of truth for the final appearance.
2.  **Asset Locations:** The images for the curiosity pages are located in `/public/curiosity_pics/` with the filenames `Deep_Brain.png`, `Spiritual_Brain.png`, `Heart_Left.png`, and `Heart_Right.png`.

## OTHER CONSIDERATIONS:

This is a list of critical UI/UX requirements that must be handled correctly.

1.  **Splash Screen (`/`):** Must be implemented to match Mockup 1. This includes the dark blue background, the "27 Circle" logo, and the "Be Curious Together" tagline. This will replace the temporary "Welcome to 27 Circle" page.
2.  **First Page (`/welcome` or similar):** Must match Mockup 2. This includes the top image, the "Meet 3 curious minds" headline, the subtext, and the styled "Start my journey" button.
3.  **Onboarding Forms (`/profile`, `/verify`):** Must match the styling of Mockup 5. This includes the layout, input field styles, labels, and the main action button.
4.  **Curiosity Page "Glow" Effect (CRITICAL):** The `InterestSelection` component must be updated with the following interaction:
    *   **On Hover:** The image "glows" with a color appropriate to the image (e.g., a blue glow for the brain images, a green/gold glow for the heart images). The glow should be implemented using Tailwind's `filter drop-shadow(...)`.
    *   **On Select (Click):** The image is selected, and the glow effect **persists** to show it is in a selected state. Clicking again deselects it and removes the persistent glow.
5.  **Font & Colors:** All fonts, text sizes, and colors (especially the brand's primary dark blue) must be implemented to match the mockups.