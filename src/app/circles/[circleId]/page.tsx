"use client";

import { useParams, useRouter } from "next/navigation";
import { useCurrentTime } from "@/lib/hooks/useCurrentTime";

export default function UpcomingCirclePage() {
  const params = useParams();
  const router = useRouter();
  const currentTime = useCurrentTime();
  
  // Mock data - in real app this would come from the database based on circleId
  const circleData = {
    timeSlot: "02:00 PM - 02:20 PM",
    spark: "What's one of the major problems that you see on campus?",
    location: "Stanford University - Old Union",
    mapUrl: "/api/placeholder/map" // This would be a real map in production
  };

  const formatAppTime = (time: Date) => {
    return time.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="px-6 pt-6 pb-4" style={{backgroundColor: '#0E2C54'}}>
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => router.back()}
            className="p-2 -ml-2"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="p-2">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
        
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Upcoming Circle</h1>
          <p className="text-gray-300 text-base">{circleData.timeSlot}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6">
        {/* Spark Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start space-x-3">
            <div className="mt-1 p-2 bg-gray-100 rounded-full">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Spark:</h3>
              <p className="text-gray-700 text-base">{circleData.spark}</p>
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start space-x-3 mb-4">
            <div className="mt-1">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{circleData.location}</h3>
              <button className="text-sm text-blue-600 underline mt-1">
                View the exact spot
              </button>
            </div>
          </div>
          
          {/* Map Container */}
          <div className="relative h-48 bg-gray-200 rounded-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-green-200">
              {/* Stanford Campus Representation */}
              <div className="absolute top-4 left-4 w-16 h-12 bg-green-600 rounded opacity-80"></div>
              <div className="absolute top-8 right-6 w-20 h-16 bg-green-700 rounded opacity-70"></div>
              <div className="absolute bottom-6 left-8 w-12 h-8 bg-green-500 rounded opacity-90"></div>
              
              {/* Roads */}
              <div className="absolute top-0 left-1/2 w-1 h-full bg-gray-400 transform -translate-x-1/2"></div>
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-400 transform -translate-y-1/2"></div>
              
              {/* Old Union Marker */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                  <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
                  <div className="absolute -bottom-1 left-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-red-500 transform -translate-x-1/2"></div>
                </div>
              </div>
              
              {/* Location Labels */}
              <div className="absolute top-2 left-2 text-xs font-medium text-gray-700">Panama Mall</div>
              <div className="absolute bottom-2 right-2 text-xs font-medium text-gray-700">Stanford University Bookstore</div>
              <div className="absolute top-1/3 left-1/4 text-xs font-medium text-white bg-red-500 px-2 py-1 rounded shadow">
                Old Union
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}