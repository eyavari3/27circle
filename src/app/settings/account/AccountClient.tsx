"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatPhoneNumber } from '@/lib/utils/phoneFormatter';

interface AccountData {
  fullName: string;
  gender: string;
  dateOfBirth: string;
  location: string;
  phoneNumber?: string;
}

export default function AccountClient() {
  const router = useRouter();
  const [accountData, setAccountData] = useState<AccountData>({
    fullName: '',
    gender: '',
    dateOfBirth: '',
    location: 'Stanford University',
    phoneNumber: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const genderOptions = ['Male', 'Female', 'Non-binary'];
  const locationOptions = ['Stanford University', 'Palo Alto', 'San Francisco', 'Other'];

  // Load saved account data on mount
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const saved = localStorage.getItem('dev-user-account');
      if (saved) {
        try {
          setAccountData(JSON.parse(saved));
        } catch (e) {
          console.error('Error loading account data:', e);
        }
      }
    }
  }, []);

  const handleInputChange = (field: keyof AccountData, value: string) => {
    if (field === 'phoneNumber') {
      // Auto-format phone number as user types
      const formatted = formatPhoneNumber(value);
      setAccountData(prev => ({ ...prev, [field]: formatted }));
    } else {
      setAccountData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      if (process.env.NODE_ENV === 'development') {
        localStorage.setItem('dev-user-account', JSON.stringify(accountData));
        console.log('✅ Account data saved:', accountData);
      }
      
      // In production, this would save to the database
      // await saveUserAccount(accountData);
      
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      router.back();
    } catch (error) {
      console.error('Error saving account data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    if (process.env.NODE_ENV === 'development') {
      localStorage.clear();
      router.push('/');
    }
    // In production, this would trigger account deletion flow
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center p-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors mr-4"
          aria-label="Go back"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Title */}
      <div className="px-6 mb-8">
        <h1 className="text-3xl font-medium text-gray-900">Account Information</h1>
      </div>

      {/* Form */}
      <div className="px-6 space-y-6">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={accountData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            placeholder="Full Name"
            className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 placeholder-gray-400"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender
          </label>
          <div className="relative">
            <select
              value={accountData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 appearance-none cursor-pointer"
            >
              <option value="">Select Gender</option>
              {genderOptions.map(option => (
                <option key={option} value={option.toLowerCase()}>
                  {option}
                </option>
              ))}
            </select>
            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={accountData.phoneNumber || ''}
            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            placeholder="(555) 123-4567"
            className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 placeholder-gray-400"
          />
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth
          </label>
          <div className="relative">
            <input
              type="date"
              value={accountData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
            />
            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <div className="relative">
            <select
              value={accountData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 appearance-none cursor-pointer"
            >
              {locationOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full py-4 rounded-full font-medium text-white transition-all ${
              isSaving
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* Delete Account */}
        <div className="pt-8 border-t border-gray-200">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 hover:text-red-700 font-medium transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Account</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}