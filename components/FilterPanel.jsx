"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FilterPanel = ({ 
  isOpen, 
  onClose, 
  filters, 
  onFiltersChange,
  plotData = [] 
}) => {
  // Get unique facing values from plot data
  const availableFacings = useMemo(() => {
    const facings = new Set();
    plotData.forEach(plot => {
      if (plot.sheetData?.facing) {
        facings.add(plot.sheetData.facing);
      }
    });
    return Array.from(facings).sort();
  }, [plotData]);

  // Filter ranges - your specified values
  const SQFT_MIN = 3500;
  const SQFT_MAX = 5893;
  const PLOT_SIZE_MIN = 353;
  const PLOT_SIZE_MAX = 814;

  const handleStatusToggle = useCallback((status) => {
    const newStatuses = filters.availability.includes(status)
      ? filters.availability.filter(s => s !== status)
      : [...filters.availability, status];
    
    onFiltersChange({
      ...filters,
      availability: newStatuses
    });
  }, [filters, onFiltersChange]);

  const handleTypeToggle = useCallback((type) => {
    const newTypes = filters.type.includes(type)
      ? filters.type.filter(t => t !== type)
      : [...filters.type, type];
    
    onFiltersChange({
      ...filters,
      type: newTypes
    });
  }, [filters, onFiltersChange]);

  const handleFacingToggle = useCallback((facing) => {
    const newFacings = filters.facing.includes(facing)
      ? filters.facing.filter(f => f !== facing)
      : [...filters.facing, facing];
    
    onFiltersChange({
      ...filters,
      facing: newFacings
    });
  }, [filters, onFiltersChange]);

  const handleRangeChange = useCallback((type, values) => {
    onFiltersChange({
      ...filters,
      [type]: values
    });
  }, [filters, onFiltersChange]);

  const clearAllFilters = useCallback(() => {
    onFiltersChange({
      availability: [],
      type: [],
      facing: [],
      sqftRange: [SQFT_MIN, SQFT_MAX],
      plotSizeRange: [PLOT_SIZE_MIN, PLOT_SIZE_MAX]
    });
  }, [onFiltersChange]);

  const getActiveFilterCount = useMemo(() => {
    let count = 0;
    count += filters.availability.length;
    count += filters.type.length;
    count += filters.facing.length;
    
    // Check if ranges are not at default values
    if (filters.sqftRange[0] !== SQFT_MIN || filters.sqftRange[1] !== SQFT_MAX) count++;
    if (filters.plotSizeRange[0] !== PLOT_SIZE_MIN || filters.plotSizeRange[1] !== PLOT_SIZE_MAX) count++;
    
    return count;
  }, [filters]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          
          {/* Filter Panel */}
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-80 bg-gray-900/95 backdrop-blur-lg border-r border-gray-700 z-50 overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  🔍 Filters
                  {getActiveFilterCount > 0 && (
                    <span className="bg-cyan-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                      {getActiveFilterCount}
                    </span>
                  )}
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  ✕
                </button>
              </div>

              {/* Quick Status Filters */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Availability</h3>
                <div className="flex flex-wrap gap-2">
                  {['Available', 'Sold', 'Blocked'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusToggle(status)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        filters.availability.includes(status)
                          ? 'bg-cyan-500 text-black'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type Filters */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Villa Type</h3>
                <div className="flex flex-wrap gap-2">
                  {['Premium', 'Standard'].map(type => (
                    <button
                      key={type}
                      onClick={() => handleTypeToggle(type)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        filters.type.includes(type)
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Facing Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Facing Direction</h3>
                <div className="grid grid-cols-2 gap-2">
                  {availableFacings.map(facing => (
                    <button
                      key={facing}
                      onClick={() => handleFacingToggle(facing)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        filters.facing.includes(facing)
                          ? 'bg-cyan-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {facing}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sq. Ft Range */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3">
                  Sq. Ft Range: {filters.sqftRange[0].toLocaleString()} - {filters.sqftRange[1].toLocaleString()}
                </h3>
                <RangeSlider
                  min={SQFT_MIN}
                  max={SQFT_MAX}
                  values={filters.sqftRange}
                  onChange={(values) => handleRangeChange('sqftRange', values)}
                  step={50}
                />
              </div>

              {/* Plot Size Range */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3">
                  Plot Size: {filters.plotSizeRange[0]} - {filters.plotSizeRange[1]} SqYds
                </h3>
                <RangeSlider
                  min={PLOT_SIZE_MIN}
                  max={PLOT_SIZE_MAX}
                  values={filters.plotSizeRange}
                  onChange={(values) => handleRangeChange('plotSizeRange', values)}
                  step={5}
                />
              </div>

              {/* Clear All Button */}
              {getActiveFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Simple Range Slider Component
const RangeSlider = ({ min, max, values, onChange, step = 1 }) => {
  const handleMinChange = (e) => {
    const newMin = Math.min(Number(e.target.value), values[1] - step);
    onChange([newMin, values[1]]);
  };

  const handleMaxChange = (e) => {
    const newMax = Math.max(Number(e.target.value), values[0] + step);
    onChange([values[0], newMax]);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={values[0]}
          onChange={handleMinChange}
          step={step}
          className="absolute w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-thumb"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={values[1]}
          onChange={handleMaxChange}
          step={step}
          className="absolute w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-thumb"
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>{min.toLocaleString()}</span>
        <span>{max.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default FilterPanel;
