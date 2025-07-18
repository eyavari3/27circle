/**
 * Context-Aware Typography System for 27 Circle
 * 
 * This utility provides typography scales based on visual context.
 * Replaces the component-only specs from UX-guide.md with proper hierarchy.
 */

export const typography = {
  // Hero context - Landing page primary elements
  hero: {
    title: 'text-[2rem] font-bold tracking-wide', // 32px - "Lead with Curiosity"
    subtitle: 'text-lg font-medium tracking-wide', // 18px - splash subtitle
  },

  // Page context - Main page headers and primary content
  page: {
    title: 'text-2xl font-bold tracking-wide', // 24px - "Settings", page headers
    subtitle: 'text-lg font-medium', // 18px - page subtitles
    header: 'text-xl font-bold text-white', // 20px - blue headers like "Upcoming Circle"
  },

  // Section context - Content area headers and important elements
  section: {
    title: 'text-lg font-semibold', // 18px - section headers
    subtitle: 'text-base font-medium', // 16px - section subtitles
    label: 'text-sm font-medium text-gray-700', // 14px - form labels
  },

  // Component context - UI elements, buttons, body text
  component: {
    body: 'text-base', // 16px - main body text
    small: 'text-sm text-gray-600', // 14px - helper text, captions
    button: 'text-sm font-medium', // 14px - button text
    input: 'text-base', // 16px - input field text
  },

  // Responsive utilities that maintain context awareness
  responsive: {
    heroTitle: 'text-[1.75rem] sm:text-[2rem] lg:text-[2.25rem] font-bold tracking-wide',
    pageTitle: 'text-xl sm:text-2xl font-bold tracking-wide',
    sectionTitle: 'text-base sm:text-lg font-semibold',
  }
};

/**
 * Helper function to get typography classes by context and variant
 */
export function getTypography(context: keyof typeof typography, variant: string): string {
  const contextStyles = typography[context];
  if (contextStyles && variant in contextStyles) {
    return (contextStyles as any)[variant];
  }
  return typography.component.body; // fallback
}

/**
 * Typography constants that match mockup measurements
 */
export const TYPOGRAPHY_CONSTANTS = {
  // Measured from mockups
  SPLASH_HERO_SIZE: '2rem', // 32px - "Lead with Curiosity"
  PAGE_TITLE_SIZE: '1.5rem', // 24px - "Settings", "Check your SMS"
  BLUE_HEADER_SIZE: '1.25rem', // 20px - "Upcoming Circle", "How did the 2PM Circle Go?"
  
  // Spacing that matches mockups
  HERO_MARGIN_BOTTOM: 'mb-4', // 16px
  PAGE_TITLE_MARGIN_BOTTOM: 'mb-6', // 24px
  SECTION_SPACING: 'mb-4', // 16px
} as const;