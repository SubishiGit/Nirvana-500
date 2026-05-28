"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { filterService } from './FilterService';

const FilterPanelV2 = ({ 
  isOpen, 
  onClose, 
  onFiltersApplied,
  onFiltersCleared
}) => {
  const [filterOptions, setFilterOptions] = useState(null);
  const [filters, setFilters] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isApplying, setIsApplying] = useState(false);

  // Load filter options when component mounts
  useEffect(() => {
    if (isOpen && !filterOptions) {
      loadFilterOptions();
    }
  }, [isOpen, filterOptions]);

  const loadFilterOptions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const options = await filterService.getFilterOptions();
      setFilterOptions(options);
      
      // Initialize filters with default values
      if (!filters) {
        setFilters(filterService.createDefaultFilters(options));
      }
    } catch (err) {
      setError('Failed to load filter options');
      console.error('Filter options error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = useCallback((filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  }, []);

  const handleToggleFilter = useCallback((filterType, item) => {
    setFilters(prev => {
      const currentItems = prev[filterType] || [];
      const newItems = currentItems.includes(item)
        ? currentItems.filter(i => i !== item)
        : [...currentItems, item];
      
      return {
        ...prev,
        [filterType]: newItems
      };
    });
  }, []);

  const applyFilters = async () => {
    if (!filters || !filterOptions) return;
    
    setIsApplying(true);
    setError(null);
    
    try {
      const result = await filterService.applyFilters(filters);
      onFiltersApplied(result);
    } catch (err) {
      setError('Failed to apply filters');
      console.error('Apply filters error:', err);
    } finally {
      setIsApplying(false);
    }
  };

  const clearAllFilters = useCallback(() => {
    if (!filterOptions) return;
    
    const defaultFilters = filterService.createDefaultFilters(filterOptions);
    setFilters(defaultFilters);
    onFiltersCleared();
  }, [filterOptions, onFiltersCleared]);

  const isFiltersActive = filterOptions && filters ? 
    filterService.areFiltersActive(filters, filterOptions) : false;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
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
              🔍 Villa Filters
              {isFiltersActive && (
                <span className="bg-cyan-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                  Active
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

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-400">Loading filter options...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
              <p className="text-red-300 text-sm">{error}</p>
              <button
                onClick={loadFilterOptions}
                className="mt-2 text-red-400 hover:text-red-300 text-sm underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Filter Options */}
          {filterOptions && filters && (
            <>
              {/* Availability Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Availability</h3>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.availability.map(status => (
                    <button
                      key={status}
                      onClick={() => handleToggleFilter('availability', status)}
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

              {/* Type Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Villa Type</h3>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.types.map(type => (
                    <button
                      key={type}
                      onClick={() => handleToggleFilter('type', type)}
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
                  {filterOptions.facing.map(facing => (
                    <button
                      key={facing}
                      onClick={() => handleToggleFilter('facing', facing)}
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
              {filterOptions.sqftRange.max > filterOptions.sqftRange.min && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">
                    Sq. Ft: {filters.sqftRange[0].toLocaleString()} - {filters.sqftRange[1].toLocaleString()}
                  </h3>
                  <RangeSlider
                    min={filterOptions.sqftRange.min}
                    max={filterOptions.sqftRange.max}
                    values={filters.sqftRange}
                    onChange={(values) => handleFilterChange('sqftRange', values)}
                    step={50}
                  />
                </div>
              )}

              {/* Plot Size Range */}
              {filterOptions.plotSizeRange.max > filterOptions.plotSizeRange.min && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">
                    Plot Size: {filters.plotSizeRange[0]} - {filters.plotSizeRange[1]} SqYds
                  </h3>
                  <RangeSlider
                    min={filterOptions.plotSizeRange.min}
                    max={filterOptions.plotSizeRange.max}
                    values={filters.plotSizeRange}
                    onChange={(values) => handleFilterChange('plotSizeRange', values)}
                    step={5}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={applyFilters}
                  disabled={isApplying}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isApplying ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      Applying...
                    </>
                  ) : (
                    'Apply Filters'
                  )}
                </button>

                {isFiltersActive && (
                  <button
                    onClick={clearAllFilters}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
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

export default FilterPanelV2;
