/**
 * Onboarding State Management
 * Handles persistence of user selections through authentication flow
 * 
 * MIGRATION: Updated to use new Storage utility instead of localStorage for dev/prod parity
 */

export interface OnboardingState {
  curiositySelections: string[];
  isInOnboarding: boolean;
  hasCompletedAuth: boolean;
}

const STORAGE_KEY = 'onboarding-state';

export async function saveOnboardingState(state: Partial<OnboardingState>): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    const existing = await getOnboardingState();
    const updated = { ...existing, ...state };
    
    const { Storage } = await import('./storage');
    const success = await Storage.set(STORAGE_KEY, updated);
    
    if (success) {
      console.log('💾 Saved onboarding state to storage:', updated);
    } else {
      console.error('❌ Failed to save onboarding state to storage');
    }
  } catch (error) {
    console.error('Failed to save onboarding state:', error);
  }
}

export async function getOnboardingState(): Promise<OnboardingState> {
  const defaultState = {
    curiositySelections: [],
    isInOnboarding: false,
    hasCompletedAuth: false
  };
  
  if (typeof window === 'undefined') {
    return defaultState;
  }

  try {
    const { Storage } = await import('./storage');
    const stored = await Storage.get<OnboardingState>(STORAGE_KEY, null);
    
    if (!stored) {
      return defaultState;
    }
    
    return {
      curiositySelections: stored.curiositySelections || [],
      isInOnboarding: stored.isInOnboarding || false,
      hasCompletedAuth: stored.hasCompletedAuth || false
    };
  } catch (error) {
    console.error('Failed to get onboarding state from storage:', error);
    return defaultState;
  }
}

export async function clearOnboardingState(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    const { Storage } = await import('./storage');
    const success = await Storage.remove(STORAGE_KEY);
    
    if (success) {
      console.log('🗑️ Cleared onboarding state from storage');
    } else {
      console.error('❌ Failed to clear onboarding state from storage');
    }
  } catch (error) {
    console.error('Failed to clear onboarding state:', error);
  }
}

export async function startOnboarding(): Promise<void> {
  await saveOnboardingState({
    isInOnboarding: true,
    hasCompletedAuth: false,
    curiositySelections: []
  });
}

export async function completeOnboarding(): Promise<void> {
  await clearOnboardingState();
}

export async function setAuthCompleted(): Promise<void> {
  await saveOnboardingState({
    hasCompletedAuth: true
  });
}

export async function addCuriositySelection(interests: string[]): Promise<void> {
  try {
    const state = await getOnboardingState();
    const allSelections = [...new Set([...state.curiositySelections, ...interests])];
    
    await saveOnboardingState({
      curiositySelections: allSelections
    });
  } catch (error) {
    console.error('Failed to add curiosity selection:', error);
    // Fallback: try to save just the new interests
    try {
      await saveOnboardingState({
        curiositySelections: interests,
        isInOnboarding: true
      });
    } catch (fallbackError) {
      console.error('Fallback save also failed:', fallbackError);
    }
  }
}

// Utility function to check if onboarding state is valid
export async function isOnboardingStateValid(): Promise<boolean> {
  try {
    const state = await getOnboardingState();
    return state.isInOnboarding && state.curiositySelections.length > 0;
  } catch (error) {
    console.error('Error checking onboarding state validity:', error);
    return false;
  }
}