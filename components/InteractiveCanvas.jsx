"use client";

import React, { useRef, useEffect, useState } from 'react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
// Removed on-screen control icons per request

export function InteractiveCanvas({ 
  children, 
  minZoom = 0.1, 
  maxZoom = 10, 
  initialZoom = 1,
  onZoomChange
}) {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile for responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 900);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Controls removed: keep gestures and programmatic control only

  // Handle zoom change callbacks
  const handleTransformChange = (ref, state) => {
    if (onZoomChange) {
      onZoomChange(state.scale);
    }
  };

  // Custom panning handler to limit viewport emptiness to 90%
  const handlePanning = (ref, state) => {
    const { positionX, positionY, scale } = state;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Get the transform component to access image dimensions
    const transformComponent = ref.contentRef?.current;
    if (!transformComponent) return;
    
    const img = transformComponent.querySelector('img');
    if (!img) return;
    
    // Get current image dimensions
    const imgWidth = img.offsetWidth;
    const imgHeight = img.offsetHeight;
    
    if (!imgWidth || !imgHeight) return;
    
    // Calculate the scaled image dimensions
    const scaledWidth = imgWidth * scale;
    const scaledHeight = imgHeight * scale;
    
    // Calculate how much of the viewport can be empty (90% max)
    const maxEmptyWidth = viewportWidth * 0.9;
    const maxEmptyHeight = viewportHeight * 0.9;
    
    // Calculate the minimum image area that must be visible (10% of viewport)
    const minVisibleWidth = viewportWidth * 0.1;
    const minVisibleHeight = viewportHeight * 0.1;
    
    // Calculate the maximum allowed position (image can go this far off-screen)
    const maxOffsetX = scaledWidth - minVisibleWidth;
    const maxOffsetY = scaledHeight - minVisibleHeight;
    
    // Calculate the minimum allowed position (image must show at least 10% of viewport)
    const minOffsetX = viewportWidth - minVisibleWidth;
    const minOffsetY = viewportHeight - minVisibleHeight;
    
    // Clamp the position
    const clampedX = Math.max(-maxOffsetX, Math.min(minOffsetX, positionX));
    const clampedY = Math.max(-maxOffsetY, Math.min(minOffsetY, positionY));
    
    // If position was clamped, update it
    if (clampedX !== positionX || clampedY !== positionY) {
      ref.setTransform(clampedX, clampedY, scale, 0);
    }
  };


  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      <TransformWrapper
        initialScale={initialZoom}
        minScale={minZoom}
        maxScale={maxZoom}
        centerZoomedOut={true}
        centerOnInit={true}
        initialPositionX={0}
        initialPositionY={0}
        wheel={{
          step: 0.3, // Match button zoom step
          smoothStep: 0.01,
          activationKeys: [],
          touchPadDisabled: false,
          excluded: [],
        }}
        pinch={{
          step: 0.3, // Match button zoom step
          disabled: false,
          excluded: [],
        }}
        pan={{
          disabled: false,
          velocityDisabled: false,
          lockAxisX: false,
          lockAxisY: false,
          limitToBounds: false,
        }}
        doubleClick={{
          disabled: true, // Disable double-click zoom to prevent conflicts
        }}
        onTransformed={handleTransformChange}
        onPanning={handlePanning}
        limitToBounds={false}
        boundaryFriction={0}
        alignmentAnimation={{
          disabled: false,
          sizeX: 0,
          sizeY: 0,
          velocityAlignmentTime: 0.2,
        }}
        velocityAnimation={{
          disabled: false,
          equalToMove: true,
          animationTime: 0.3,
          animationType: 'easeOut',
        }}
        smooth={true}
        smoothTime={0.3}
        transformEnabled={true}
        panning={{
          disabled: false,
          wheelPanning: false,
          excluded: [],
        }}
        zoomAnimation={{
          disabled: false,
          size: 0.2,
          animationTime: 0.3,
          animationType: 'easeOut',
        }}
        disablePadding={false}
      >
        {/* Controls removed */}
        <TransformComponent
          wrapperClass="w-full h-full"
          contentClass="w-full h-full flex items-center justify-center"
          wrapperStyle={{
            width: '100%',
            height: '100%',
            cursor: 'grab',
          }}
          contentStyle={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}