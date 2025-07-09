# Product Requirements Document: Complete Onboarding UI/UX Implementation

## Feature Overview
Implementation of pixel-perfect UI/UX for the entire user onboarding flow, transforming the existing basic components into production-ready screens that match the provided mockups exactly. This includes styling all pages from the Splash Screen to the final Curiosity selection with proper image handling, responsive design, and interactive effects.

## Core Requirements

### 1. Splash Screen (`/`)
- **Mockup Reference**: `/public/Images/Sign up /1- Splash Screen.png`
- **Design Elements**:
  - Deep blue gradient background (#1e3a8a to #1e40af)
  - Centered white "27 Circle" logo with speed lines
  - "Be Curious Together" tagline in clean white typography
  - Full-screen mobile-first design
  - Smooth fade-in animation on load

### 2. Welcome/First Page (`/welcome`)
- **Mockup Reference**: `/public/Images/Sign up /2- First Page.png`
- **Design Elements**:
  - Hero image: `/images/onboarding/Friends_Seated.png` (migrated from current path)
  - Rounded corners on hero image
  - "Meet 3 curious minds" headline
  - "Hang out for 20 minute on campus" subtitle
  - "Initiative for a more connected world by 2027" description
  - Navy blue "Start my journey" CTA button with rounded corners
  - "Free & Secure Access" secondary text
  - Clean white background with proper spacing

### 3. Curiosity Page 1 (`/onboarding/curiosity-1`)
- **Mockup Reference**: `/public/Images/Sign up /3- Curiosity 1.png`
- **Design Elements**:
  - Back button (arrow icon) in top-left
  - "Let Your Curiosity Lead" main heading
  - "What draws your mind to connect?" subheading
  - "Select ones that resonate" instruction text
  - Two brain imagery options with hover/selection effects:
    - Deep Conversations: Blue brain with flowing patterns
    - Spiritual Exploration: Orange/gold brain with warm tones
  - "Explore Actions" CTA button (disabled until selection)
  - "Step 1 of 2" progress indicator
  - Interactive glow effects on selection

### 4. Curiosity Page 2 (`/onboarding/curiosity-2`)
- **Mockup Reference**: `/public/Images/Sign up /4- Curiosity 2.png`
- **Design Elements**:
  - Same header structure as Page 1
  - "And what actions call to your heart?" subheading
  - Two heart imagery options with hover/selection effects:
    - New Activities: Blue heart with dynamic elements
    - Community Service: Gold heart with nature elements
  - "Lead with Curiosity" CTA button (note different text)
  - "Step 2 of 2" progress indicator
  - Consistent glow effects matching Page 1

### 5. Image Asset Management
- **Source Migration**: Move all images from current paths to organized structure
- **New Image Paths**:
  - `/images/onboarding/Friends_Seated.png` (welcome page)
  - `/images/curiosity/Deep_Brain.png` (curiosity 1)
  - `/images/curiosity/Spiritual_Brain.png` (curiosity 1)
  - `/images/curiosity/Heart_Left.png` (curiosity 2)
  - `/images/curiosity/Heart_Right.png` (curiosity 2)
- **Implementation**: Use Next.js `Image` component with proper optimization

### 6. Interactive Effects System
- **Hover Effects**:
  - Color-appropriate glow using Tailwind `drop-shadow`
  - Subtle scale transform (scale-105)
  - Smooth transitions (transition-all duration-200)
- **Selection Effects**:
  - Persistent glow effect with stronger intensity
  - Visual selection indicator (border or background highlight)
  - State persistence across page interactions
- **Glow Colors**:
  - Deep Conversations & New Activities: Blue glow (#3b82f6)
  - Spiritual Exploration & Community Service: Orange/Gold glow (#f59e0b)

## Technical Architecture

### File Structure
```
src/
├── app/
│   ├── page.tsx                    # Splash screen
│   ├── welcome/
│   │   └── page.tsx               # Welcome/First page
│   └── onboarding/
│       ├── curiosity-1/page.tsx   # Mind curiosity selection
│       └── curiosity-2/page.tsx   # Heart curiosity selection
├── components/
│   └── onboarding/
│       ├── SplashScreen.tsx       # Splash screen component
│       ├── WelcomeScreen.tsx      # Welcome page component
│       ├── CuriositySelector.tsx  # Reusable curiosity selection
│       └── InterestSelection.tsx  # Enhanced existing component
public/
├── images/
│   ├── onboarding/
│   │   └── Friends_Seated.png
│   └── curiosity/
│       ├── Deep_Brain.png
│       ├── Spiritual_Brain.png
│       ├── Heart_Left.png
│       └── Heart_Right.png
```

### Component Patterns
- **Server Components**: Static page layouts and initial data
- **Client Components**: Interactive elements with state management
- **Shared Styling**: Consistent button styles, typography, and spacing
- **Responsive Design**: Mobile-first with proper breakpoints

## Design System Specifications

### Typography
- **Main Headings**: text-2xl font-bold text-gray-900
- **Subheadings**: text-lg text-gray-700
- **Body Text**: text-base text-gray-600
- **Button Text**: text-white font-medium
- **Progress Text**: text-sm text-gray-500

### Color Palette
- **Primary Blue**: #1e40af (buttons, accents)
- **Background**: #ffffff (main), #f8fafc (subtle)
- **Text**: #111827 (primary), #374151 (secondary), #6b7280 (tertiary)
- **Glow Effects**: #3b82f6 (blue), #f59e0b (orange/gold)

### Spacing & Layout
- **Container**: max-w-md mx-auto px-4 py-8
- **Section Spacing**: space-y-6
- **Button Padding**: px-8 py-3
- **Image Spacing**: mb-6
- **Progress Indicator**: mt-4 text-center

### Interactive States
- **Hover**: transform scale-105, drop-shadow-lg
- **Selected**: persistent glow, border highlight
- **Disabled**: opacity-50, cursor-not-allowed
- **Loading**: opacity-75, spinner overlay

## Implementation Details

### 1. Asset Migration
- Create proper directory structure in `/public/images/`
- Update all image references to use new paths
- Verify image optimization with Next.js Image component
- Test all images load correctly in development

### 2. Splash Screen Implementation
- Create full-screen centered layout
- Implement gradient background with CSS classes
- Add fade-in animation using CSS transitions
- Include auto-redirect to welcome page after 2 seconds

### 3. Welcome Page Enhancement
- Replace basic layout with mockup-matching design
- Implement hero image with proper aspect ratio
- Style CTA button with hover effects
- Add proper typography hierarchy

### 4. Curiosity Pages Upgrade
- Enhance existing InterestSelection component
- Add proper image layouts with selection states
- Implement glow effects with Tailwind utilities
- Add progress indicators and navigation
- Ensure state persistence between pages

### 5. Interactive Effects
- Implement hover effects using CSS transitions
- Add selection state management
- Create reusable glow effect utilities
- Test touch interactions on mobile devices

## Testing Requirements

### Visual Testing
- **Pixel Comparison**: Compare rendered pages with mockups
- **Responsive Testing**: Verify layout on mobile, tablet, desktop
- **Interactive Testing**: Confirm hover and selection effects work
- **Image Loading**: Verify all images load and display correctly

### Functional Testing
- **Navigation Flow**: Test complete onboarding progression
- **State Management**: Verify selections persist across pages
- **Error Handling**: Test with missing images or network issues
- **Accessibility**: Ensure keyboard navigation and screen reader compatibility

### Performance Testing
- **Image Optimization**: Verify Next.js Image optimization works
- **Load Times**: Measure page load performance
- **Bundle Size**: Check JavaScript bundle impact
- **Animation Performance**: Ensure smooth 60fps animations

## Accessibility Considerations
- **Alt Text**: Provide descriptive alt text for all images
- **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
- **Screen Reader Support**: Use semantic HTML and ARIA labels
- **Color Contrast**: Verify sufficient contrast ratios
- **Focus Indicators**: Clear focus states for interactive elements

## Success Criteria
1. **Visual Fidelity**: Pages match mockups within 95% accuracy
2. **Performance**: Page load times under 2 seconds
3. **Responsiveness**: Perfect display on all device sizes
4. **Interactions**: Smooth hover/selection effects at 60fps
5. **Accessibility**: Passes WCAG 2.1 AA standards
6. **User Experience**: Intuitive navigation through onboarding flow

## References
- **Mockups**: `/public/Images/Sign up /` directory
- **Existing Code**: `/src/components/onboarding/InterestSelection.tsx`
- **Global Rules**: `CLAUDE.md` styling guidelines
- **Asset Organization**: Updated image directory structure in `CLAUDE.md`