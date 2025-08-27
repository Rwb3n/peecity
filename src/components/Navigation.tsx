'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"

interface NavigationProps {
  currentView: 'search' | 'submit'
  onViewChange: (view: 'search' | 'submit') => void
}

export function Navigation({ currentView, onViewChange }: NavigationProps) {
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-primary">🚽 CityPee</h1>
            <span className="text-sm text-muted-foreground">London Public Toilets</span>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant={currentView === 'search' ? 'default' : 'outline'}
              onClick={() => onViewChange('search')}
            >
              🔍 Search
            </Button>
            <Button 
              variant={currentView === 'submit' ? 'default' : 'outline'}
              onClick={() => onViewChange('submit')}
            >
              ➕ Submit
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}