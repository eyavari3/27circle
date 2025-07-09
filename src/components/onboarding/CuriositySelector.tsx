"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { saveUserInterests } from "@/app/onboarding/actions";

interface CuriosityOption {
  interestKey: string;
  label: string;
  imagePath: string;
  glowColor: string;
}

interface CuriositySelectorProps {
  title: string;
  subtitle: string;
  options: CuriosityOption[];
  nextPageUrl: string;
  buttonText: string;
  stepText: string;
}

export default function CuriositySelector({
  title,
  subtitle,
  options,
  nextPageUrl,
  buttonText,
  stepText,
}: CuriositySelectorProps) {
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
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto sm:max-w-lg lg:max-w-xl">
        <div className="flex items-center mb-8">
          <button
            onClick={handleBack}
            className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 active:bg-gray-400 active:scale-95 transition-all duration-200"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {title}
            </h1>
            <p className="text-lg text-gray-700">
              {subtitle}
            </p>
            <div className="w-16 h-0.5 bg-gray-300 mx-auto"></div>
            <p className="text-sm text-gray-500">
              Select ones that resonate
            </p>
          </div>

          {/* Side-by-side grid layout for mobile */}
          <div className="grid grid-cols-2 gap-4 py-8 sm:gap-8 lg:gap-12">
            {options.map((option, index) => (
              <div
                key={option.interestKey}
                className="text-center cursor-pointer group"
                onClick={() => handleSelect(option.interestKey)}
              >
                <div className={`
                  relative w-full aspect-square max-w-[160px] mx-auto mb-4 rounded-2xl overflow-hidden transition-all duration-300 ease-out
                  ${selected.includes(option.interestKey) 
                    ? `${option.glowColor} transform scale-105 ring-4 ring-blue-200` 
                    : 'hover:scale-105 active:scale-95 hover:' + option.glowColor.split(' ')[0]
                  }
                `}>
                  <Image
                    src={option.imagePath}
                    alt={option.label}
                    fill
                    className="object-cover"
                    priority={index === 0}
                  />
                  {selected.includes(option.interestKey) && (
                    <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                <p className={`text-sm sm:text-base lg:text-lg font-medium transition-colors duration-200 ${
                  selected.includes(option.interestKey) 
                    ? 'text-blue-600' 
                    : 'text-gray-800 group-hover:text-gray-900'
                }`}>
                  {option.label}
                </p>
              </div>
            ))}
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleNext}
              disabled={loading || selected.length === 0}
              className="w-full bg-blue-800 hover:bg-blue-900 active:bg-blue-950 active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-4 px-8 rounded-full text-lg transition-all duration-200"
            >
              {loading ? "Saving..." : buttonText}
            </button>
            
            <p className="text-sm text-gray-400 text-center">
              {stepText}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}