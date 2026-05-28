export async function POST(req) {
  try {
    const filterCriteria = await req.json();
    
    // Get the villa data from our existing API
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3001";
    const plotsResponse = await fetch(`${baseUrl}/api/plots`, { 
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!plotsResponse.ok) {
      throw new Error('Failed to fetch villa data');
    }
    
    const plotsData = await plotsResponse.json();
    const villas = plotsData.rows || [];
    
    // Apply filters
    const filteredVillas = applyFilters(villas, filterCriteria);
    
    // Return filtered results with metadata
    return Response.json({
      success: true,
      totalVillas: villas.length,
      filteredCount: filteredVillas.length,
      villas: filteredVillas,
      appliedFilters: filterCriteria,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Filter API Error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to filter villas',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

function applyFilters(villas, criteria) {
  return villas.filter(villa => {
    // Skip if not a villa or no data
    if (!villa || !villa.villaKey) return false;
    
    // Availability filter
    if (criteria.availability && criteria.availability.length > 0) {
      if (!criteria.availability.includes(villa.availability)) {
        return false;
      }
    }
    
    // Villa type filter (Premium/Standard based on plot size)
    if (criteria.type && criteria.type.length > 0) {
      const plotSize = parseFloat(villa.plotSize) || 0;
      const villaType = plotSize > 500 ? "Premium" : "Standard";
      if (!criteria.type.includes(villaType)) {
        return false;
      }
    }
    
    // Facing direction filter
    if (criteria.facing && criteria.facing.length > 0) {
      if (!criteria.facing.includes(villa.facing)) {
        return false;
      }
    }
    
    // Square footage range filter
    if (criteria.sqftRange && criteria.sqftRange.length === 2) {
      const sqft = parseFloat(villa.sqft) || 0;
      if (sqft < criteria.sqftRange[0] || sqft > criteria.sqftRange[1]) {
        return false;
      }
    }
    
    // Plot size range filter
    if (criteria.plotSizeRange && criteria.plotSizeRange.length === 2) {
      const plotSize = parseFloat(villa.plotSize) || 0;
      if (plotSize < criteria.plotSizeRange[0] || plotSize > criteria.plotSizeRange[1]) {
        return false;
      }
    }
    
    // Price range filter (if provided)
    if (criteria.priceRange && criteria.priceRange.length === 2) {
      const price = parseFloat(villa.price) || 0;
      if (price < criteria.priceRange[0] || price > criteria.priceRange[1]) {
        return false;
      }
    }
    
    return true;
  });
}

// GET endpoint for filter options (available values)
export async function GET() {
  try {
    // Get the villa data
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3001";
    const plotsResponse = await fetch(`${baseUrl}/api/plots`, { cache: 'no-store' });
    
    if (!plotsResponse.ok) {
      throw new Error('Failed to fetch villa data');
    }
    
    const plotsData = await plotsResponse.json();
    const villas = plotsData.rows || [];
    
    // Extract unique filter options
    const filterOptions = extractFilterOptions(villas);
    
    return Response.json({
      success: true,
      options: filterOptions,
      totalVillas: villas.length
    });
    
  } catch (error) {
    console.error('Filter Options API Error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to get filter options',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

function extractFilterOptions(villas) {
  const options = {
    availability: new Set(),
    facing: new Set(),
    types: new Set(),
    sqftRange: { min: Infinity, max: -Infinity },
    plotSizeRange: { min: Infinity, max: -Infinity },
    priceRange: { min: Infinity, max: -Infinity }
  };
  
  villas.forEach(villa => {
    if (!villa.villaKey) return; // Skip non-villas
    
    // Availability options
    if (villa.availability) {
      options.availability.add(villa.availability);
    }
    
    // Facing options
    if (villa.facing) {
      options.facing.add(villa.facing);
    }
    
    // Type options (based on plot size)
    const plotSize = parseFloat(villa.plotSize) || 0;
    if (plotSize > 0) {
      const type = plotSize > 500 ? "Premium" : "Standard";
      options.types.add(type);
      
      // Plot size range
      options.plotSizeRange.min = Math.min(options.plotSizeRange.min, plotSize);
      options.plotSizeRange.max = Math.max(options.plotSizeRange.max, plotSize);
    }
    
    // Square footage range
    const sqft = parseFloat(villa.sqft) || 0;
    if (sqft > 0) {
      options.sqftRange.min = Math.min(options.sqftRange.min, sqft);
      options.sqftRange.max = Math.max(options.sqftRange.max, sqft);
    }
    
    // Price range
    const price = parseFloat(villa.price) || 0;
    if (price > 0) {
      options.priceRange.min = Math.min(options.priceRange.min, price);
      options.priceRange.max = Math.max(options.priceRange.max, price);
    }
  });
  
  // Convert Sets to Arrays and handle edge cases
  return {
    availability: Array.from(options.availability).sort(),
    facing: Array.from(options.facing).sort(),
    types: Array.from(options.types).sort(),
    sqftRange: options.sqftRange.min !== Infinity ? options.sqftRange : { min: 0, max: 0 },
    plotSizeRange: options.plotSizeRange.min !== Infinity ? options.plotSizeRange : { min: 0, max: 0 },
    priceRange: options.priceRange.min !== Infinity ? options.priceRange : { min: 0, max: 0 }
  };
}
