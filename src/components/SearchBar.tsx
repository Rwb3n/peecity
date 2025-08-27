'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

interface SearchBarProps {
  onSearch: (query: string) => void
  loading?: boolean
}

export function SearchBar({ onSearch, loading = false }: SearchBarProps) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
    }
  }

  const handleLocationSearch = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onSearch(`${position.coords.latitude},${position.coords.longitude}`)
        },
        (error) => {
          console.error('Geolocation error:', error)
          alert('Unable to get your location. Please enter a location manually.')
        }
      )
    } else {
      alert('Geolocation is not supported by this browser.')
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter location, postcode, or area..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
              disabled={loading}
            />
            <Button 
              type="submit" 
              disabled={loading || !query.trim()}
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
          <div className="text-center">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleLocationSearch}
              disabled={loading}
              className="w-full"
            >
              📍 Use My Location
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}