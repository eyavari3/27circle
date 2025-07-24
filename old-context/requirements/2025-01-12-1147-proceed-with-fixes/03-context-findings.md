# Context Findings

## Specific Files That Need Modification

### Image Path Issues (Critical)

**1. SplashScreen.tsx (line 59):**
- Current: `/Images/Sign up /27 Circle White Text.png`
- Fix: Update to use `/images/logo.png` (from existing PNG/logo.png)

**2. InterestSelection.tsx (used by multiple pages):**
- This component receives image paths via props from parent pages
- Parents pass incorrect paths that need updating

**3. Curiosity Page Files:**
- `src/app/onboarding/curiosity-1/page.tsx` (lines 10, 16)
- `src/app/onboarding/curiosity-1.1/page.tsx` (lines 10, 16)
- Need to update image paths passed to InterestSelection component

**4. CirclesClient.tsx (line 346):**
- Current: `/Images/Sign up /Sign up /Old-Union.jpg`
- Fix: Update to proper location image path

### Configuration Issues

**5. tailwind.config.js (line 7):**
- Current: `'./context/**/*.{js,ts,jsx,tsx}'`
- Fix: `'./src/context/**/*.{js,ts,jsx,tsx}'`

## Current File Structure Analysis

### Available Images:
```
/public/Images/
├── PNG/
│   ├── logo.png ✅ (perfect for splash screen)
│   ├── brain-left.png ✅
│   ├── brain-right.png ✅
│   ├── heart-left.png ✅
│   └── heart-right.png ✅
└── Other/
    ├── curiosity/
    │   ├── Deep_Brain.png ✅
    │   ├── Spiritual_Brain.png ✅
    │   ├── Heart_Left.png ✅
    │   └── Heart_Right.png ✅
    └── Sign up/
        └── [various mockup images]
```

## Technical Implementation Patterns

### Image Component Usage (Already Correct):
- All components use Next.js `Image` component properly
- Proper sizing with `fill` and `sizes` attributes
- Priority loading for above-fold images
- Correct object-fit settings

### Component Architecture:
- **InterestSelection.tsx**: Reusable component accepting image paths via props
- **Parent pages**: Pass specific image paths to InterestSelection
- **Pattern to follow**: Update props in parent components, not InterestSelection itself

## Missing Auth Implementation

### Required Files (Not Yet Created):
- `src/app/auth/page.tsx` (Server Component)
- `src/components/AuthForm.tsx` (Client Component)
- `src/components/BackButton.tsx` (Client Component)

### Integration Points:
- Route protection in layout or middleware
- Redirect logic after successful auth
- Connection to Supabase auth system

## Exact Patterns to Follow

### Image Path Convention:
```typescript
// Current (broken):
imagePath: "/Images/curiosity/Deep_Brain.png"

// Fixed (working):
imagePath: "/images/curiosity/Deep_Brain.png"
```

### Component Props Pattern:
```typescript
// In curiosity pages, update the options array:
const options: Option[] = [
  {
    interestKey: "scientific_topics",
    label: "Deep Conversations", 
    imagePath: "/images/curiosity/Deep_Brain.png", // Fixed path
    glowColor: 'blue'
  }
]
```

## Technical Constraints

### User's Preferred Structure:
- Keep existing `/public/Images/` structure (don't reorganize)
- Update component paths to match existing structure
- Use logical subdirectories (PNG for assets, Other for page-specific)

### Implementation Order:
1. Fix Tailwind config first (enables styles)
2. Update image paths in components
3. Test splash screen and onboarding flow
4. Implement auth pages if needed
5. Verify end-to-end functionality

## Files Requiring Updates:

1. `tailwind.config.js` - Fix content path
2. `src/components/onboarding/SplashScreen.tsx` - Logo path
3. `src/app/onboarding/curiosity-1/page.tsx` - Image paths in options
4. `src/app/onboarding/curiosity-1.1/page.tsx` - Image paths in options
5. `src/app/circles/CirclesClient.tsx` - Map image path
6. Potentially create auth route structure