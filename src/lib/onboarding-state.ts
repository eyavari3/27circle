/**
 * Onboarding State Management
 * Handles persistence of user selections through authentication flow
 */

export interface OnboardingState {
  curiositySelections: string[];
  isInOnboarding: boolean;
  hasCompletedAuth: boolean;
}

const STORAGE_KEY = 'onboarding-state';

export function saveOnboardingState(state: Partial<OnboardingState>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const existing = getOnboardingState();
    const updated = { ...existing, ...state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    console.log('💾 Saved onboarding state:', updated);
  } catch (error) {
    console.error('Failed to save onboarding state:', error);
  }
}

export function getOnboardingState(): OnboardingState {
  if (typeof window === 'undefined') {
    return {
      curiositySelections: [],
      isInOnboarding: false,
      hasCompletedAuth: false
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        curiositySelections: [],
        isInOnboarding: false,
        hasCompletedAuth: false
      };
    }
    
    const parsed = JSON.parse(stored);
    return {
      curiositySelections: parsed.curiositySelections || [],
      isInOnboarding: parsed.isInOnboarding || false,
      hasCompletedAuth: parsed.hasCompletedAuth || false
    };
  } catch (error) {
    console.error('Failed to parse onboarding state:', error);
    return {
      curiositySelections: [],
      isInOnboarding: false,
      hasCompletedAuth: false
    };
  }
}

export function clearOnboardingState(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ Cleared onboarding state');
  } catch (error) {
    console.error('Failed to clear onboarding state:', error);
  }
}

export function startOnboarding(): void {
  saveOnboardingState({
    isInOnboarding: true,
    hasCompletedAuth: false,
    curiositySelections: []
  });
}

export function completeOnboarding(): void {
  clearOnboardingState();
}

export function setAuthCompleted(): void {
  saveOnboardingState({
    hasCompletedAuth: true
  });
}

export function addCuriositySelection(interests: string[]): void {
  try {
    const state = getOnboardingState();
    const allSelections = [...new Set([...state.curiositySelections, ...interests])];
    
    saveOnboardingState({
      curiositySelections: allSelections
    });
  } catch (error) {
    console.error('Failed to add curiosity selection:', error);
    // Fallback: try to save just the new interests
    try {
      saveOnboardingState({
        curiositySelections: interests,
        isInOnboarding: true
      });
    } catch (fallbackError) {
      console.error('Fallback save also failed:', fallbackError);
    }
  }
}

// Utility function to check if onboarding state is valid
export function isOnboardingStateValid(): boolean {
  try {
    const state = getOnboardingState();
    return state.isInOnboarding && state.curiositySelections.length > 0;
  } catch (error) {
    console.error('Error checking onboarding state validity:', error);
    return false;
  }
}