'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface SubmitFormProps {
  onSubmit: (data: any) => Promise<void>
}

export function SubmitForm({ onSubmit }: SubmitFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    lat: '',
    lng: '',
    hours: '',
    accessible: false,
    fee: '0',
    address: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const submitData = {
        ...formData,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        fee: parseFloat(formData.fee)
      }
      
      await onSubmit(submitData)
      setSuccess(true)
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          name: '',
          lat: '',
          lng: '',
          hours: '',
          accessible: false,
          fee: '0',
          address: ''
        })
        setSuccess(false)
      }, 3000)
      
    } catch (error) {
      console.error('Submission error:', error)
      alert('Failed to submit toilet information. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-green-600 mb-2">✅</div>
          <h3 className="font-semibold text-green-800">Thank you!</h3>
          <p className="text-green-600">Your toilet information has been submitted successfully.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit New Toilet Location</CardTitle>
        <CardDescription>
          Help others by adding a public toilet location
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name *</label>
            <Input
              type="text"
              placeholder="e.g., Covent Garden Public Toilets"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium">Latitude *</label>
              <Input
                type="number"
                step="any"
                placeholder="51.5074"
                value={formData.lat}
                onChange={(e) => setFormData(prev => ({ ...prev, lat: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Longitude *</label>
              <Input
                type="number"
                step="any"
                placeholder="-0.1278"
                value={formData.lng}
                onChange={(e) => setFormData(prev => ({ ...prev, lng: e.target.value }))}
                required
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Address</label>
            <Input
              type="text"
              placeholder="Full address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Opening Hours</label>
            <Input
              type="text"
              placeholder="e.g., 24/7 or 08:00-18:00"
              value={formData.hours}
              onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Fee (£)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0"
              value={formData.fee}
              onChange={(e) => setFormData(prev => ({ ...prev, fee: e.target.value }))}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="accessible"
              checked={formData.accessible}
              onChange={(e) => setFormData(prev => ({ ...prev, accessible: e.target.checked }))}
            />
            <label htmlFor="accessible" className="text-sm">Wheelchair accessible</label>
          </div>
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Submitting...' : 'Submit Toilet Location'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}