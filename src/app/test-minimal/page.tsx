'use client';

import { ErrorFactory } from '@/lib';

/**
 * Minimal tree-shaking test page
 * 
 * This page imports only ErrorFactory from @/lib to test
 * whether webpack properly isolates imports.
 * 
 * Expected in bundle:
 * - ErrorFactory and its dependencies
 * 
 * Should NOT be in bundle:
 * - calculateDistance or other geospatial functions
 * - validateSuggestion or validation functions
 * - Any metrics or monitoring code
 */
export default function MinimalTestPage() {
  const handleTest = () => {
    const error = ErrorFactory.validation('Test error', null, 'Test details');
    console.log('Error created:', error);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Minimal Tree-Shaking Test</h1>
      <p className="mb-4">
        This page imports only ErrorFactory from @/lib to test minimal tree-shaking.
      </p>
      <button 
        onClick={handleTest}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
      >
        Test ErrorFactory Only
      </button>
      <div className="mt-4 text-sm text-gray-600">
        <p>Imported from @/lib: ErrorFactory only</p>
        <p>Should NOT include: calculateDistance, validateSuggestion, metrics, etc.</p>
      </div>
    </div>
  );
}