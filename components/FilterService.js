/**
 * FilterService - Manages villa filtering logic and API communication
 */
class FilterService {
  constructor() {
    this.baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get available filter options from the API
   */
  async getFilterOptions() {
    const cacheKey = 'filter-options';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/villas/filter`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get filter options');
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: result.options,
        timestamp: Date.now()
      });

      return result.options;
    } catch (error) {
      console.error('FilterService: Failed to get filter options:', error);
      // Return default options on error
      return {
        availability: ['Available', 'Sold', 'Blocked'],
        facing: ['North', 'South', 'East', 'West', 'Northeast', 'Northwest', 'Southeast', 'Southwest'],
        types: ['Standard', 'Premium'],
        sqftRange: { min: 3500, max: 5893 },
        plotSizeRange: { min: 353, max: 814 },
        priceRange: { min: 0, max: 0 }
      };
    }
  }

  /**
   * Apply filters and get matching villas
   */
  async applyFilters(filterCriteria) {
    try {
      const response = await fetch(`${this.baseUrl}/api/villas/filter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filterCriteria),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to apply filters');
      }

      return {
        villas: result.villas,
        totalCount: result.totalVillas,
        filteredCount: result.filteredCount,
        appliedFilters: result.appliedFilters,
        timestamp: result.timestamp
      };
    } catch (error) {
      console.error('FilterService: Failed to apply filters:', error);
      throw error;
    }
  }

  /**
   * Check if filters are active (not default values)
   */
  areFiltersActive(filters, defaultOptions) {
    if (!filters || !defaultOptions) return false;

    // Check availability filter
    if (filters.availability && filters.availability.length > 0) {
      return true;
    }

    // Check type filter
    if (filters.type && filters.type.length > 0) {
      return true;
    }

    // Check facing filter
    if (filters.facing && filters.facing.length > 0) {
      return true;
    }

    // Check sqft range
    if (filters.sqftRange && filters.sqftRange.length === 2) {
      const [min, max] = filters.sqftRange;
      if (min !== defaultOptions.sqftRange.min || max !== defaultOptions.sqftRange.max) {
        return true;
      }
    }

    // Check plot size range
    if (filters.plotSizeRange && filters.plotSizeRange.length === 2) {
      const [min, max] = filters.plotSizeRange;
      if (min !== defaultOptions.plotSizeRange.min || max !== defaultOptions.plotSizeRange.max) {
        return true;
      }
    }

    // Check price range
    if (filters.priceRange && filters.priceRange.length === 2) {
      const [min, max] = filters.priceRange;
      if (min !== defaultOptions.priceRange.min || max !== defaultOptions.priceRange.max) {
        return true;
      }
    }

    return false;
  }

  /**
   * Create default filter state
   */
  createDefaultFilters(options) {
    return {
      availability: [],
      type: [],
      facing: [],
      sqftRange: [options.sqftRange.min, options.sqftRange.max],
      plotSizeRange: [options.plotSizeRange.min, options.plotSizeRange.max],
      priceRange: [options.priceRange.min, options.priceRange.max]
    };
  }

  /**
   * Convert villa data to plot IDs for SVG highlighting
   */
  villasToPlotIds(villas, allPlots) {
    const villaKeys = new Set(villas.map(villa => villa.villaKey));
    
    return allPlots
      .filter(plot => plot.plotType === 'villa' && plot.sheetData && villaKeys.has(plot.sheetData.villaKey))
      .map(plot => plot.id);
  }

  /**
   * Clear cache (useful for development or data updates)
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
export const filterService = new FilterService();
export default FilterService;
