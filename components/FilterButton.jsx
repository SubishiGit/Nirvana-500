"use client";

import React from 'react';
import { motion } from 'framer-motion';

const FilterButton = ({ onClick, hasActiveFilters = false }) => {
  return (
    <motion.button
      onClick={onClick}
      className={`fixed top-4 right-4 p-4 rounded-lg border-2 transition-all ${
        hasActiveFilters 
          ? 'bg-cyan-500 border-cyan-400 text-black' 
          : 'bg-red-500 border-red-400 text-white hover:bg-red-600'
      }`}
      style={{
        zIndex: 99999,
        pointerEvents: 'auto',
        position: 'fixed',
        minWidth: '120px',
        minHeight: '50px',
        fontSize: '16px',
        fontWeight: 'bold'
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="flex items-center gap-2">
        🔍
        <span className="font-medium">Filters</span>
        {hasActiveFilters && (
          <span className="bg-black/20 text-xs px-1.5 py-0.5 rounded-full">
            Active
          </span>
        )}
      </div>
    </motion.button>
  );
};

export default FilterButton;
