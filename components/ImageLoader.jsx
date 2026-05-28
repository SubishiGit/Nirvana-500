"use client";

import { useState, useEffect, useCallback } from 'react';

export function useProgressiveImage(src) {
  const [currentSrc, setCurrentSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadImage = useCallback((src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadSingle = async () => {
      if (!src) {
        if (mounted) {
          setCurrentSrc(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setCurrentSrc(src);
        await loadImage(src);
        if (mounted) {
          setIsLoading(false);
        }
      } catch {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadSingle();
    return () => { mounted = false; };
  }, [src, loadImage]);

  return { currentSrc, isLoading };
}