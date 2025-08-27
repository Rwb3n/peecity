'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ToiletData {
  id: string
  name: string
  lat: number
  lng: number
  hours: string
  accessible: boolean
  fee: number
  address: string
}

interface ToiletCardProps {
  toilet: ToiletData
  onShare: (toilet: ToiletData) => void
  onReport: (toilet: ToiletData) => void
}

export function ToiletCard({ toilet, onShare, onReport }: ToiletCardProps) {
  const formatFee = (fee: number) => {
    if (fee === 0) return 'Free'
    return `£${fee.toFixed(2)}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{toilet.name}</span>
          <div className="flex gap-1">
            {toilet.accessible && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                ♿ Accessible
              </span>
            )}
            <span className={`text-xs px-2 py-1 rounded ${
              toilet.fee === 0 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {formatFee(toilet.fee)}
            </span>
          </div>
        </CardTitle>
        <CardDescription>{toilet.address}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Hours:</strong> {toilet.hours}
          </div>
          <div>
            <strong>Fee:</strong> {formatFee(toilet.fee)}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onShare(toilet)}
            className="flex-1"
          >
            📤 Share
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onReport(toilet)}
            className="flex-1"
          >
            🚨 Report Issue
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}