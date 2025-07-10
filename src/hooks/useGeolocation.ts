/**
 * useGeolocation Hook
 * 
 * React hook for managing browser geolocation API with comprehensive error handling,
 * permission management, and performance optimizations for mobile devices.
 * 
 * @artifact-annotation
 * canonical-docs: docs/frontend-ui-spec.md
 * epic: frontend_ui
 * plan: plan_frontend_molecules.txt
 * task: search_impl
 * tdd-phase: GREEN
 */

import { useState, useEffect, useCallback, useRef } from 'react'

interface GeolocationPosition {
  latitude: number
  longitude: number
  accuracy: number
}

interface GeolocationError {
  code: number
  message: string
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

interface UseGeolocationReturn {
  location: GeolocationPosition | null
  error: string | null
  loading: boolean
  requestLocation: () => void
  watchPosition: () => void
  clearWatch: () => void
}

const DEFAULT_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: false,
  timeout: 15000,
  maximumAge: 300000, // 5 minutes
}

const ERROR_MESSAGES = {
  1: 'Permission denied',
  2: 'Position unavailable',
  3: 'Timeout',
  UNSUPPORTED: 'Geolocation is not supported',
}

export function useGeolocation(options: GeolocationOptions = {}): UseGeolocationReturn {
  const [location, setLocation] = useState<GeolocationPosition | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const watchIdRef = useRef<number | null>(null)
  const mountedRef = useRef(true)
  const loadingRef = useRef(false)
  
  const geolocationOptions = { ...DEFAULT_OPTIONS, ...options }

  // Check if geolocation is supported
  useEffect(() => {
    if (!navigator.geolocation) {
      setError(ERROR_MESSAGES.UNSUPPORTED)
    }
    
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Success callback
  const handleSuccess = useCallback((position: GeolocationPosition) => {
    if (!mountedRef.current) return
    
    setLocation({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    })
    setError(null)
    setLoading(false)
    loadingRef.current = false
  }, [])

  // Error callback
  const handleError = useCallback((error: GeolocationError) => {
    if (!mountedRef.current) return
    
    const errorMessage = ERROR_MESSAGES[error.code as keyof typeof ERROR_MESSAGES] || error.message
    setError(errorMessage)
    setLocation(null)
    setLoading(false)
    loadingRef.current = false
  }, [])

  // Request current position
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError(ERROR_MESSAGES.UNSUPPORTED)
      return
    }

    // Prevent duplicate requests
    if (loadingRef.current) return

    loadingRef.current = true
    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      geolocationOptions
    )
  }, [handleSuccess, handleError, geolocationOptions])

  // Watch position changes
  const watchPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError(ERROR_MESSAGES.UNSUPPORTED)
      return
    }

    // Clear existing watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      geolocationOptions
    )
  }, [handleSuccess, handleError, geolocationOptions])

  // Clear watch
  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearWatch()
    }
  }, [clearWatch])

  return {
    location,
    error,
    loading,
    requestLocation,
    watchPosition,
    clearWatch,
  }
}