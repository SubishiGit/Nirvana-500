"use client";

import React, { useState } from 'react';

const SimpleFilterPanel = ({ isOpen, onClose, onFiltersApplied, onFiltersCleared }) => {
  const [selectedAvailability, setSelectedAvailability] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedFacing, setSelectedFacing] = useState([]);

  if (!isOpen) return null;

  const availabilityOptions = ['Available', 'Sold', 'Blocked'];
  const typeOptions = ['Premium', 'Standard'];
  const facingOptions = ['North', 'South', 'East', 'West', 'Northeast', 'Northwest', 'Southeast', 'Southwest'];

  const toggleAvailability = (option) => {
    setSelectedAvailability(prev => 
      prev.includes(option) 
        ? prev.filter(item => item !== option)
        : [...prev, option]
    );
  };

  const toggleType = (option) => {
    setSelectedTypes(prev => 
      prev.includes(option) 
        ? prev.filter(item => item !== option)
        : [...prev, option]
    );
  };

  const toggleFacing = (option) => {
    setSelectedFacing(prev => 
      prev.includes(option) 
        ? prev.filter(item => item !== option)
        : [...prev, option]
    );
  };

  const applyFilters = () => {
    // Mock filter result for now
    const mockResult = {
      villas: [],
      totalCount: 100,
      filteredCount: 25,
      timestamp: new Date().toISOString()
    };
    onFiltersApplied(mockResult);
    onClose();
  };

  const clearFilters = () => {
    setSelectedAvailability([]);
    setSelectedTypes([]);
    setSelectedFacing([]);
    onFiltersCleared();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        style={{ zIndex: 999998 }}
        onClick={onClose}
      />
      
      {/* Filter Panel */}
      <div 
        className="fixed left-0 top-0 h-full bg-gray-900 text-white overflow-y-auto"
        style={{ 
          zIndex: 999999,
          width: '320px',
          padding: '24px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>🔍 Villa Filters</h2>
          <div 
            onClick={onClose}
            style={{ 
              cursor: 'pointer', 
              fontSize: '18px', 
              padding: '4px',
              color: '#9CA3AF'
            }}
          >
            ✕
          </div>
        </div>

        {/* Availability Filter */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px', color: '#D1D5DB' }}>
            Availability
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {availabilityOptions.map(option => (
              <div
                key={option}
                onClick={() => toggleAvailability(option)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  backgroundColor: selectedAvailability.includes(option) ? '#06B6D4' : '#374151',
                  color: selectedAvailability.includes(option) ? 'black' : '#D1D5DB',
                  transition: 'all 0.2s'
                }}
              >
                {option}
              </div>
            ))}
          </div>
        </div>

        {/* Type Filter */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px', color: '#D1D5DB' }}>
            Villa Type
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {typeOptions.map(option => (
              <div
                key={option}
                onClick={() => toggleType(option)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  backgroundColor: selectedTypes.includes(option) ? '#8B5CF6' : '#374151',
                  color: selectedTypes.includes(option) ? 'white' : '#D1D5DB',
                  transition: 'all 0.2s'
                }}
              >
                {option}
              </div>
            ))}
          </div>
        </div>

        {/* Facing Filter */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px', color: '#D1D5DB' }}>
            Facing Direction
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {facingOptions.map(option => (
              <div
                key={option}
                onClick={() => toggleFacing(option)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  backgroundColor: selectedFacing.includes(option) ? '#10B981' : '#374151',
                  color: selectedFacing.includes(option) ? 'white' : '#D1D5DB',
                  transition: 'all 0.2s'
                }}
              >
                {option}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            onClick={applyFilters}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              backgroundColor: '#0891B2',
              color: 'white',
              textAlign: 'center',
              transition: 'all 0.2s'
            }}
          >
            Apply Filters
          </div>

          <div
            onClick={clearFilters}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              backgroundColor: '#DC2626',
              color: 'white',
              textAlign: 'center',
              transition: 'all 0.2s'
            }}
          >
            Clear All Filters
          </div>
        </div>
      </div>
    </>
  );
};

export default SimpleFilterPanel;
