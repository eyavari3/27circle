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
    const storage = new Storage();
    const success = await storage.set(STORAGE_KEY, updated);
    
    if (success) {
      // Success - no console spam
    }
  } catch (error) {
    // Silent error handling to prevent console spam
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
    const storage = new Storage();
    const stored = await storage.get<OnboardingState>(STORAGE_KEY, null);
    
    if (!stored) {
      return defaultState;
    }
    
    return {
      curiositySelections: stored.curiositySelections || [],
      isInOnboarding: stored.isInOnboarding || false,
      hasCompletedAuth: stored.hasCompletedAuth || false
    };
  } catch (error) {
    return defaultState;
  }
}

export async function clearOnboardingState(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    const { Storage } = await import('./storage');
    const storage = new Storage();
    await storage.remove(STORAGE_KEY);
  } catch (error) {
    // Silent error handling
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
    // Fallback: try to save just the new interests
    try {
      await saveOnboardingState({
        curiositySelections: interests,
        isInOnboarding: true
      });
    } catch (fallbackError) {
      // Silent fallback error handling
    }
  }
}

// Utility function to check if onboarding state is valid
export async function isOnboardingStateValid(): Promise<boolean> {
  try {
    const state = await getOnboardingState();
    return state.isInOnboarding && state.curiositySelections.length > 0;
  } catch (error) {
    return false;
  }
}