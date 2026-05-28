"use client";

import React, { useState, useEffect } from 'react';

export default function OrientationLock({ children }) {
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Detect if it's a mobile device (screen width less than 900px)
      const mobile = width < 900;
      
      // Check if portrait (height > width) on mobile
      const portrait = mobile && height > width;
      
      setIsMobile(mobile);
      setIsPortrait(portrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Show orientation lock screen only on mobile portrait
  if (isMobile && isPortrait) {
    return (
      <div className="w-screen h-screen bg-black flex flex-col items-center justify-center text-white p-8 text-center">
        {/* Animated rotation icon */}
        <div className="relative mb-8">
          {/* Phone outline */}
          <svg 
            width="80" 
            height="120" 
            viewBox="0 0 80 120" 
            className="text-gray-300"
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3"
          >
            <rect x="10" y="10" width="60" height="100" rx="8" ry="8" />
            <line x1="30" y1="20" x2="50" y2="20" />
            <circle cx="40" cy="95" r="3" />
          </svg>
          
          {/* Rotation arrow */}
          <div className="absolute -right-6 top-1/2 transform -translate-y-1/2">
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              className="text-cyan-400 animate-pulse"
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.39 0 4.68.94 6.36 2.64L21 8"/>
              <path d="M17 4l4 4-4 4"/>
            </svg>
          </div>
        </div>

        {/* Title and message */}
        <h2 className="text-2xl font-bold mb-4 text-white">
          Rotate Your Device
        </h2>
        <p className="text-gray-400 text-lg mb-2">
          Please turn your phone to landscape mode
        </p>
        <p className="text-gray-500 text-sm">
          for the best viewing experience
        </p>

        {/* Landscape icon hint */}
        <div className="mt-8 opacity-50">
          <svg 
            width="120" 
            height="80" 
            viewBox="0 0 120 80" 
            className="text-gray-600"
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <rect x="10" y="20" width="100" height="40" rx="8" ry="8" />
            <line x1="20" y1="30" x2="40" y2="30" />
            <circle cx="95" cy="45" r="3" />
          </svg>
        </div>
      </div>
    );
  }

  // Show normal content for landscape or desktop
  return <>{children}</>;
}
