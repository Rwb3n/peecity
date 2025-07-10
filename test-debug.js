import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// Create a simple test component that uses the hook
const TestComponent = () => {
  const mockHook = require('./src/hooks/useGeolocation').useGeolocation
  const result = mockHook()
  
  return (
    <div>
      <button onClick={result.requestLocation}>Request Location</button>
      {result.error && <div>Error: {result.error}</div>}
    </div>
  )
}

// Mock the hook
jest.mock('./src/hooks/useGeolocation', () => ({
  useGeolocation: jest.fn(() => ({
    location: null,
    error: 'Permission denied',
    loading: false,
    requestLocation: jest.fn()
  }))
}))

// Run test
describe('Debug Test', () => {
  test('should show error', () => {
    render(<TestComponent />)
    expect(screen.getByText(/Error: Permission denied/i)).toBeInTheDocument()
  })
})
EOF < /dev/null