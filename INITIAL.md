## FEATURE:
Implement the complete, pixel-perfect UI/UX for the entire user onboarding flow. This involves styling all pages from the Splash Screen to the final Curiosity selection, ensuring they match the provided mockups exactly.

## REQUIREMENTS:
1. **Splash Screen (`/`):** Must match mockup at `/public/Images/Sign up/1- Splash Screen.png`

2. **First Page (`/welcome` or similar):** Must match mockup at `/public/Images/Sign up/2- First Page.png`
   - Use the Friends_Seated.png image located at `/public/Images/Sign up/curiosity_pics/Friends_Seated.png`

3. **Curiosity Pages:** 
   - Page 1: Must match mockup at `/public/Images/Sign up/3- Curiosity 1.png`
   - Page 2: Must match mockup at `/public/Images/Sign up/4- Curiosity 2.png`

4. **Image Paths:** Update all image paths in the InterestSelection component:
   - Deep Conversations: `/images/curiosity_pics/Deep_Brain.png`
   - Spiritual Exploration: `/images/curiosity_pics/Spiritual_Brain.png`
   - New Activities: `/images/curiosity_pics/Heart_Left.png`
   - Community Service: `/images/curiosity_pics/Heart_Right.png`

5. **Curiosity Page Glow Effect:**
   - On Hover: Color-appropriate glow using Tailwind drop-shadow
   - On Select: Persistent glow effect
   - Blue glow for Deep/New, Orange/Gold glow for Spiritual/Community

## EXAMPLES:
- Reference the mockup images directly for pixel-perfect implementation
- Current InterestSelection component at src/components/onboarding/InterestSelection.tsx

## OTHER CONSIDERATIONS:
- All mockups are available in `/public/Images/Sign up/` for reference
- Ensure Next.js Image component uses correct paths
- Follow Tailwind CSS conventions from CLAUDE.md