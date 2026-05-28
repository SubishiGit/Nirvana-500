"use client";

import React from 'react';

const SimpleTestButtons = () => {
  return (
    <>
      {/* Top-left corner - Basic visibility test */}
      <div 
        className="fixed top-2 left-2 w-20 h-12 bg-red-600 text-white flex items-center justify-center text-sm font-bold rounded shadow-lg"
        style={{ zIndex: 999999 }}
      >
        RED
      </div>

      {/* Top-right corner - Filter button position */}
      <div 
        className="fixed top-2 right-2 w-24 h-12 bg-blue-600 text-white flex items-center justify-center text-sm font-bold rounded shadow-lg"
        style={{ zIndex: 999999 }}
      >
        BLUE
      </div>

      {/* Top-center - Another test */}
      <div 
        className="fixed top-2 left-1/2 transform -translate-x-1/2 w-24 h-12 bg-green-600 text-white flex items-center justify-center text-sm font-bold rounded shadow-lg"
        style={{ zIndex: 999999 }}
      >
        GREEN
      </div>

      {/* Bottom-left corner */}
      <div 
        className="fixed bottom-2 left-2 w-24 h-12 bg-yellow-600 text-black flex items-center justify-center text-sm font-bold rounded shadow-lg"
        style={{ zIndex: 999999 }}
      >
        YELLOW
      </div>

      {/* Bottom-right corner */}
      <div 
        className="fixed bottom-2 right-2 w-24 h-12 bg-purple-600 text-white flex items-center justify-center text-sm font-bold rounded shadow-lg"
        style={{ zIndex: 999999 }}
      >
        PURPLE
      </div>

      {/* Center of screen - Ultimate visibility test */}
      <div 
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-16 bg-orange-600 text-white flex items-center justify-center text-lg font-bold rounded-lg shadow-2xl border-4 border-white"
        style={{ zIndex: 999999 }}
      >
        CENTER
      </div>
    </>
  );
};

export default SimpleTestButtons;
