# PRP Design System - Complete Implementation Guide

## Core Design Principles
- **Mobile-First**: Design for phone dimensions with no scrolling on any page
- **Responsive Sizing**: Use REM units throughout, with 1rem = 16px base
- **Fixed Height Pages**: Each screen must fit within viewport height - squeeze content as needed
- **Font**: Inter font family across entire application

## Color Palette

### Primary Colors
- **Navy Blue (Primary)**: `#152B5C` - Used for headers, primary buttons, main branding
- **White**: `#FFFFFF` - Primary text on dark backgrounds, clean backgrounds

### Button State Colors
- **Join Button**: `#152B5C` (navy blue)
- **Can't Go Button**: `#F8F9F8` (light gray background)
- **Confirmed Button**: `#4ADE80` (green)
- **Feedback Button**: `#FB923C` (orange)
- **Past/Disabled Button**: `#EBEBEB` (medium gray)

### Input & Background Colors
- **Input Field Background**: `#F5F5F5`
- **Main Background**: `#FFFFFF`
- **Text on Light Background**: `#000000` or `#333333` for better readability

## Typography (Using Inter Font)

### Context-Aware Typography System

This design system uses different typography scales based on visual context to ensure proper hierarchy:

#### Hero Context (Landing/Splash Pages)
- **Main Title**: `2rem` (32px) - Bold - e.g., "Lead with Curiosity"
- **Subtitle**: `1.125rem` (18px) - Medium - e.g., splash subtitle

#### Page Context (Main Page Headers)  
- **Page Title**: `1.5rem` (24px) - Bold - e.g., "Settings", "Check your SMS"
- **Page Subtitle**: `1.125rem` (18px) - Medium - e.g., page subtitles
- **Blue Headers**: `1.25rem` (20px) - Bold + White - e.g., "Upcoming Circle", "How did the 2PM Circle Go?"

#### Section Context (Content Areas)
- **Section Title**: `1.125rem` (18px) - Semibold - e.g., "Upcoming Times", "Spark:"
- **Section Subtitle**: `1rem` (16px) - Medium - e.g., section subtitles  
- **Form Labels**: `0.875rem` (14px) - Medium + Gray - e.g., "How many people..."

#### Component Context (UI Elements)
- **Body Text**: `1rem` (16px) - Regular - main content text
- **Small Text**: `0.875rem` (14px) - Regular + Gray - captions, helper text
- **Button Text**: `0.875rem` (14px) - Medium - all button labels
- **Input Text**: `1rem` (16px) - Regular - form inputs

### Implementation Note
Use the typography utility at `/src/lib/typography.ts` which provides these scales:
- `typography.hero.title` / `typography.hero.subtitle`
- `typography.page.title` / `typography.page.subtitle` / `typography.page.header`
- `typography.section.title` / `typography.section.subtitle` / `typography.section.label`
- `typography.component.body` / `typography.component.small` / `typography.component.button` / `typography.component.input`

### Font Weights
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

## Spacing System (in rem)

### Base Spacing Unit
- **1 spacing unit**: `0.5rem` (8px)
- **Standard padding**: `1rem` (16px)
- **Card padding**: `1rem` (16px)
- **Screen margins**: `1rem` (16px) horizontal padding from edges
- **Gap between time slots**: `1rem` (16px) - maintains 8px grid consistency
- **Section spacing**: `1.5rem` (24px) between major sections

## Component Specifications

### Buttons
```css
/* Base button styles */
.button {
  height: 2.75rem; /* 44px */
  padding: 0 1.5rem;
  border-radius: 1.375rem; /* Fully rounded - 22px for 44px height */
  font-weight: 500;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  width: 100%;
  transition: transform 100ms ease-out, filter 100ms ease-out;
}

/* Press state animation */
.button:active {
  transform: scale(0.95);
  filter: brightness(0.9);
  transition: none; /* Instant press */
}

/* Button variants */
.button-join { background: #152B5C; color: white; }
.button-cant-go { background: #F8F9F8; color: #CA0000; }
.button-confirmed { background: #4ADE80; color: white; }
.button-feedback { background: #FB923C; color: white; }
.button-past { background: #EBEBEB; color: #999; }
```

### Input Fields
```css
.input-field {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem; /* 8px */
  border: 1px solid #E5E5E5;
  background: #F5F5F5;
  font-size: 1rem;
  font-family: 'Inter', sans-serif;
}

.input-field:focus {
  outline: none;
  border-color: #152B5C;
  background: #FFFFFF;
}

/* Error state */
.input-field.error {
  border-color: #EF4444;
  background: #FEF2F2;
}
```

### Cards (Time Slots)
```css
.time-slot-card {
  padding: 1rem;
  margin-bottom: 1rem; /* 16px gap - maintains 8px grid */
  background: #FFFFFF;
  border-radius: 0.75rem; /* 12px */
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

### Navigation Elements
```css
.back-button {
  width: 2.5rem; /* 40px */
  height: 2.5rem; /* 40px */
  border-radius: 50%;
  background: #F5F5F5;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.settings-icon {
  width: 1.5rem; /* 24px */
  height: 1.5rem; /* 24px */
  color: #FFFFFF;
}
```

## Layout Constraints

### Mobile Viewport
```css
.app-container {
  max-width: 100vw;
  height: 100vh;
  overflow: hidden; /* No scrolling allowed */
  display: flex;
  flex-direction: column;
}

.header {
  background: #152B5C;
  color: white;
  padding: 1rem;
  flex-shrink: 0;
}

.content {
  flex: 1;
  overflow: hidden; /* Content must fit */
  padding: 1rem;
}
```

## Special Components

### Logo
- Use SVG image for "27" logo with motion lines
- Logo image size: `3rem` (48px) height
- Logo text "27 Circle": 
  - Splash/Login screens: `1.375rem` (22px)
  - Not part of the logo image - rendered as separate text
- Maintain aspect ratio

### Brain/Heart Illustrations
- Use PNG images (not SVG)
- Blue brain and gold/yellow heart
- Size: Approximately `8rem` (128px) width
- Center align with proper spacing

### Map Component
- Google Maps integration with satellite view
- Height: `12rem` (192px) on mobile
- Border radius: `0.75rem` (12px)
- Show location pin at exact coordinates

### Rating Component
```css
.rating-container {
  display: flex;
  gap: 0.5rem;
}

.rating-button {
  width: 3rem;
  height: 3rem;
  border: 1px solid #E5E5E5;
  background: #FFFFFF;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
}

.rating-button.selected {
  background: #152B5C;
  color: white;
  border-color: #152B5C;
}
```

## Form Validation

### Error Messages
```css
.error-message {
  color: #EF4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
```

### Required Field Indicators
- Add asterisk (*) to required field labels
- Use subtle red color: `#EF4444`

## Critical Implementation Notes

1. **No Scrolling**: Every page must fit within the viewport. If content is too long, reduce spacing or font sizes proportionally.

2. **Press States**: All interactive elements must have the press animation:
   - Instant scale(0.95) and brightness(0.9) on press
   - 100-150ms transition back to default state

3. **Asset Management**: Keep all images as PNG files - do not convert to SVG.

4. **Touch Targets**: Maintain minimum 44px height for all interactive elements for accessibility.

5. **Performance**: Use CSS transforms for animations rather than changing dimensions to ensure smooth 60fps animations.

## Responsive Breakpoints

While this is mobile-first, if needed for larger screens:
```css
/* Tablet and up */
@media (min-width: 768px) {
  .app-container {
    max-width: 400px;
    margin: 0 auto;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  }
}
```

## Example Implementation Structure

```html
<div class="app-container">
  <header class="header">
    <button class="back-button">←</button>
    <h1 class="page-title">Today's Circles</h1>
    <button class="settings-icon">⚙</button>
  </header>
  
  <main class="content">
    <!-- Page content here -->
    <!-- Must fit without scrolling -->
  </main>
</div>
```

## Remember: The goal is a smooth, native-feeling experience that fits perfectly on mobile devices without any scrolling. Every interaction should feel responsive and intentional.