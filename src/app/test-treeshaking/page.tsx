'use client';

// Import only client-safe functions for tree-shaking test
import { calculateDistance, ErrorFactory } from '@/lib';

/**
 * Tree-shaking test page
 * 
 * This page imports only validateSuggestion from @/lib to test
 * whether webpack properly tree-shakes unused exports from the barrel.
 * 
 * Expected in bundle:
 * - validateSuggestion function
 * - Its direct dependencies (validation utilities, error handling)
 * - Framework overhead
 * 
 * Should NOT be in bundle:
 * - Geospatial functions (calculateDistance, etc.)
 * - Metrics collection functions
 * - Other unrelated @/lib exports
 */
export default function TreeShakingTestPage() {
  const handleTest = () => {
    // Test calculateDistance function
    const distance = calculateDistance(
      51.5074, -0.1278,  // London coordinates
      51.5155, -0.0922   // Greenwich coordinates
    );
    
    // Test ErrorFactory
    const error = ErrorFactory.validation('Test error', null, 'Test details');
    
    console.log('Distance calculated:', distance);
    console.log('Error created:', error);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Tree-Shaking Test Page</h1>
      <p className="mb-4">
        This page imports only validateSuggestion from @/lib to test tree-shaking effectiveness.
      </p>
      <button 
        onClick={handleTest}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Test Functions
      </button>
      <div className="mt-4 text-sm text-gray-600">
        <p>Imported from @/lib: calculateDistance, ErrorFactory</p>
        <p>Should NOT include: validation schemas, metrics functions, etc.</p>
      </div>
    </div>
  );
}