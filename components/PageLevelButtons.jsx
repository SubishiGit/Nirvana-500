"use client";

import React from 'react';

const PageLevelButtons = () => {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 999999 }}>
      {/* Extreme visibility test - should show no matter what */}
      <div 
        style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          width: '100px',
          height: '40px',
          backgroundColor: '#ff0000',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '14px',
          borderRadius: '4px',
          zIndex: 999999,
          pointerEvents: 'auto',
          boxShadow: '0 4px 8px rgba(0,0,0,0.5)'
        }}
      >
        PAGE LEVEL
      </div>

      <div 
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          width: '100px',
          height: '40px',
          backgroundColor: '#0000ff',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '14px',
          borderRadius: '4px',
          zIndex: 999999,
          pointerEvents: 'auto',
          boxShadow: '0 4px 8px rgba(0,0,0,0.5)'
        }}
      >
        TOP RIGHT
      </div>

      <div 
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '150px',
          height: '60px',
          backgroundColor: '#00ff00',
          color: 'black',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '16px',
          borderRadius: '8px',
          zIndex: 999999,
          pointerEvents: 'auto',
          boxShadow: '0 8px 16px rgba(0,0,0,0.7)',
          border: '3px solid white'
        }}
      >
        CENTER TEST
      </div>
    </div>
  );
};

export default PageLevelButtons;
