"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { saveUserInterests } from "@/app/onboarding/actions";

interface Option {
  interestKey: string;
  label: string;
  imagePath: string;
  glowColor: string;
}

interface InterestSelectionProps {
  title: string;
  subtitle: string;
  subtext?: string;
  options: Option[];
  nextPageUrl: string;
  buttonText: string;
  stepText?: string;
  showBackButton?: boolean;
}

export default function InterestSelection({
  title,
  subtitle,
  subtext,
  options,
  nextPageUrl,
  buttonText,
  stepText,
  showBackButton = false
}: InterestSelectionProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSelect = (interestKey: string) => {
    setSelected(prev =>
      prev.includes(interestKey)
        ? prev.filter(key => key !== interestKey)
        : [...prev, interestKey]
    );
  };

  const handleNext = async () => {
    setLoading(true);
    setError("");
    const result = await saveUserInterests(selected);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.push(nextPageUrl);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <main className="min-h-screen bg-white px-6 sm:px-8 py-6 pb-12">
      <div className="max-w-xs mx-auto sm:max-w-sm md:max-w-md lg:max-w-lg">
        {/* Back Arrow - Conditionally rendered */}
        {showBackButton && (
          <div className="mb-8">
            <button onClick={handleBack} className="p-2 -ml-2 bg-gray-100 rounded-full">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="text-center space-y-10">
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">{title}</h1>
            <p className="text-gray-600 text-base font-normal">{subtitle}</p>
            <div className="w-20 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mx-auto my-3"></div>
            {subtext && <p className="text-gray-500 text-sm font-light">{subtext}</p>}
          </div>
          {/* Brain Images */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:gap-8 -mx-2 sm:-mx-4">
            {options.map((option) => (
              <div
                key={option.interestKey}
                className="text-center cursor-pointer group"
                onClick={() => handleSelect(option.interestKey)}
              >
                <div className={`
                  relative w-full aspect-square transition-all duration-300 ease-out p-2
                  ${selected.includes(option.interestKey)
                    ? 'scale-110 filter ' + option.glowColor
                    : 'group-hover:scale-105 group-hover:filter ' + option.glowColor
                  }
                `}>
                  <div className="relative w-full h-full">
                    <Image
                      src={option.imagePath}
                      alt={option.label}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                </div>
                <p className="mt-4 text-sm font-medium text-gray-800">{option.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Button Section */}
        <div className="mt-12 space-y-6">
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <button
            onClick={handleNext}
            disabled={loading || selected.length === 0}
            className="w-full disabled:bg-gray-300 text-white font-medium py-4 px-8 rounded-full text-base transition-all"
            style={{backgroundColor: loading || selected.length === 0 ? undefined : '#0E2C54'}}
          >
            {loading ? "Saving..." : buttonText}
          </button>
          {stepText && (
            <div className="mt-6">
              <div className="w-12 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-auto mb-3"></div>
              <p className="text-xs text-gray-400 text-center font-light tracking-wide">{stepText}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}