"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitProfile } from "../actions";
import { getOnboardingState, completeOnboarding, setAuthCompleted } from "@/lib/onboarding-state";

export default function ProfilePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    gender: "",
    dateOfBirth: "",
    location: "Stanford University"
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing account data and handle onboarding state
  useEffect(() => {
    try {
      // Mark that auth has been completed
      setAuthCompleted();
      
      // Handle curiosity selections from onboarding state
      const onboardingState = getOnboardingState();
      if (onboardingState.isInOnboarding && onboardingState.curiositySelections.length > 0) {
        // Merge onboarding selections with any existing preferences
        if (process.env.NODE_ENV === 'development') {
          try {
            const existingSaved = localStorage.getItem('dev-user-preferences');
            let allPreferences = [...onboardingState.curiositySelections];
            
            if (existingSaved) {
              try {
                const existing = JSON.parse(existingSaved);
                // Merge arrays and remove duplicates
                allPreferences = [...new Set([...existing, ...onboardingState.curiositySelections])];
              } catch (e) {
                console.error('Error merging existing preferences:', e);
                // Fallback to just onboarding selections
                allPreferences = [...onboardingState.curiositySelections];
              }
            }
            
            localStorage.setItem('dev-user-preferences', JSON.stringify(allPreferences));
            console.log('✅ Merged onboarding curiosity selections:', allPreferences);
          } catch (storageError) {
            console.error('Error saving merged preferences to localStorage:', storageError);
            // Continue without localStorage - not critical for app function
          }
        }
      } else if (onboardingState.isInOnboarding) {
        console.warn('⚠️ User in onboarding flow but no curiosity selections found');
      }
      
      // Load existing account data if available (for consistency with settings)
      if (process.env.NODE_ENV === 'development') {
        try {
          const saved = localStorage.getItem('dev-user-account');
          if (saved) {
            try {
              const accountData = JSON.parse(saved);
              setFormData(accountData);
              console.log('📋 Loaded existing account data in onboarding:', accountData);
            } catch (parseError) {
              console.error('Error parsing account data:', parseError);
              // Clear corrupted data
              localStorage.removeItem('dev-user-account');
            }
          }
        } catch (storageError) {
          console.error('Error accessing localStorage for account data:', storageError);
        }
      }
    } catch (error) {
      console.error('Error in profile page initialization:', error);
      // Don't block the UI, just log the error
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Basic validation
    const newErrors: { [key: string]: string } = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Save to localStorage in development mode for consistency with settings
      if (process.env.NODE_ENV === 'development') {
        localStorage.setItem('dev-user-account', JSON.stringify(formData));
        console.log('✅ Onboarding profile saved to localStorage:', formData);
      }
      
      const result = await submitProfile(formData);
      if (result.error) {
        setErrors({ general: result.error });
      } else {
        try {
          // Complete onboarding and clean up state
          completeOnboarding();
        } catch (cleanupError) {
          console.error('Error cleaning up onboarding state:', cleanupError);
          // Don't block navigation - cleanup failure is not critical
        }
        router.push("/circles");
      }
    } catch (error) {
      setErrors({ general: "An unexpected error occurred. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="px-6 py-8">
        {/* Back Button */}
        <button 
          onClick={() => router.back()}
          className="mb-8 p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">A Few Final Details</h1>
            <p className="text-gray-600">This helps us us with group creation</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <div className="relative">
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
                >
                  <option value="">Select your gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <div className="relative">
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
                >
                  <option value="Stanford University">Stanford University</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="text-red-600 text-sm">{errors.general}</div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 text-white font-semibold rounded-full transition-all duration-200 disabled:opacity-50"
              style={{ backgroundColor: '#0E2C54' }}
            >
              {isSubmitting ? "Completing..." : "Complete My Journey"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 